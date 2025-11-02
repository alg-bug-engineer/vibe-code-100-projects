/**
 * Items API Routes
 * 处理所有条目相关的请求
 */

import { Router } from 'express';
import { query } from '../db/pool.js';
import { AuthRequest } from '../middleware/auth.js';

const router = Router();

/**
 * 获取条目列表
 * GET /api/items?type=task&status=pending&archived=false
 */
router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const { type, status, tag, archived } = req.query;
    const userId = req.user?.id; // 从认证中间件获取

    if (!userId) {
      return res.status(401).json({ error: '未授权' });
    }

    let sql = 'SELECT * FROM items WHERE user_id = $1';
    const params: any[] = [userId];
    let paramIndex = 2;

    if (type) {
      sql += ` AND type = $${paramIndex++}`;
      params.push(type);
    }

    if (status) {
      sql += ` AND status = $${paramIndex++}`;
      params.push(status);
    }

    if (tag) {
      sql += ` AND $${paramIndex++} = ANY(tags)`;
      params.push(tag);
    }

    if (archived === 'false') {
      sql += ' AND archived_at IS NULL';
    } else if (archived === 'true') {
      sql += ' AND archived_at IS NOT NULL';
    }

    sql += ' AND deleted_at IS NULL';
    sql += ' ORDER BY created_at DESC';

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

/**
 * 创建条目
 * POST /api/items
 */
router.post('/', async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: '未授权' });
    }

    const {
      raw_text,
      type,
      title,
      description,
      due_date,
      priority,
      status,
      tags,
      entities,
      url,
      url_title,
      url_summary,
      url_thumbnail,
      url_fetched_at,
      start_time,
      end_time,
      recurrence_rule,
      recurrence_end_date,
      master_item_id,
      is_master
    } = req.body;

    const sql = `
      INSERT INTO items (
        user_id, raw_text, type, title, description, due_date, priority, status,
        tags, entities, url, url_title, url_summary, url_thumbnail, url_fetched_at,
        start_time, end_time, recurrence_rule, recurrence_end_date, master_item_id, is_master
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
        $16, $17, $18, $19, $20, $21
      )
      RETURNING *
    `;

    // 处理时间字符串，确保 PostgreSQL 正确解析为本地时间
    // 如果时间字符串不包含时区信息，PostgreSQL 会将其当作服务器时区
    // 我们需要明确告诉它这是本地时间（不是 UTC）
    const params = [
      userId, raw_text, type, title, description, due_date, priority || 'medium',
      status || 'pending', tags || [], entities || {}, url, url_title,
      url_summary, url_thumbnail, url_fetched_at, start_time, end_time,
      recurrence_rule, recurrence_end_date, master_item_id, is_master || false
    ];

    const result = await query(sql, params);
    
    // 记录活动日志
    await query(
      'INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details) VALUES ($1, $2, $3, $4, $5)',
      [userId, 'create_item', type, result.rows[0].id, { title }]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

/**
 * 查询条目
 * POST /api/items/query
 */
router.post('/query', async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user?.id;
    const { searchText, types, statuses, tags } = req.body;

    if (!userId) {
      return res.status(401).json({ error: '未授权' });
    }

    let sql = 'SELECT * FROM items WHERE user_id = $1 AND deleted_at IS NULL';
    const params: any[] = [userId];
    let paramIndex = 2;

    if (searchText) {
      sql += ` AND (title ILIKE $${paramIndex} OR description ILIKE $${paramIndex} OR raw_text ILIKE $${paramIndex++})`;
      params.push(`%${searchText}%`);
    }

    if (types && types.length > 0) {
      sql += ` AND type = ANY($${paramIndex++})`;
      params.push(types);
    }

    if (statuses && statuses.length > 0) {
      sql += ` AND status = ANY($${paramIndex++})`;
      params.push(statuses);
    }

    if (tags && tags.length > 0) {
      sql += ` AND tags && $${paramIndex++}`;
      params.push(tags);
    }

    sql += ' ORDER BY created_at DESC LIMIT 100';

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

/**
 * 获取日历条目
 * GET /api/items/calendar?start=2025-01-01&end=2025-01-31
 */
router.get('/calendar', async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user?.id;
    const { start, end } = req.query;

    if (!userId) {
      return res.status(401).json({ error: '未授权' });
    }

    const sql = `
      SELECT * FROM items
      WHERE user_id = $1
        AND deleted_at IS NULL
        AND (
          (due_date BETWEEN $2 AND $3)
          OR (start_time BETWEEN $2 AND $3)
        )
      ORDER BY COALESCE(start_time, due_date)
    `;

    const result = await query(sql, [userId, start, end]);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

/**
 * 获取标签统计
 * GET /api/items/tags/stats
 */
router.get('/tags/stats', async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: '未授权' });
    }

    const sql = `
      SELECT 
        unnest(tags) as tag, 
        COUNT(*) as count,
        MAX(updated_at) as last_used
      FROM items
      WHERE user_id = $1 AND deleted_at IS NULL
      GROUP BY tag
      ORDER BY count DESC
    `;

    const result = await query(sql, [userId]);
    
    // 返回数组格式，符合 TagStats[] 接口
    const stats = result.rows.map(row => ({
      tag: row.tag,
      count: parseInt(row.count),
      lastUsed: row.last_used
    }));

    res.json(stats);
  } catch (error) {
    next(error);
  }
});

/**
 * 获取历史记录
 * GET /api/items/history?start=2025-01-01&end=2025-01-31
 */
router.get('/history', async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user?.id;
    const { start, end } = req.query;

    if (!userId) {
      return res.status(401).json({ error: '未授权' });
    }

    const sql = `
      SELECT * FROM items
      WHERE user_id = $1
        AND deleted_at IS NULL
        AND created_at BETWEEN $2 AND $3
      ORDER BY created_at DESC
    `;

    const result = await query(sql, [userId, start, end]);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

/**
 * 获取单个条目
 * GET /api/items/:id
 * 注意：这个路由必须放在所有具体路径的路由之后
 */
router.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: '未授权' });
    }

    const result = await query(
      'SELECT * FROM items WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '条目不存在' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

/**
 * 更新条目
 * PUT /api/items/:id
 */
router.put('/:id', async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: '未授权' });
    }

    // 构建动态更新 SQL
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    const allowedFields = [
      'title', 'description', 'due_date', 'priority', 'status', 'tags',
      'entities', 'url', 'url_title', 'url_summary', 'url_thumbnail',
      'start_time', 'end_time', 'recurrence_rule', 'recurrence_end_date'
    ];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = $${paramIndex++}`);
        params.push(req.body[field]);
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: '没有要更新的字段' });
    }

    params.push(id, userId);
    const sql = `
      UPDATE items
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramIndex++} AND user_id = $${paramIndex++} AND deleted_at IS NULL
      RETURNING *
    `;

    const result = await query(sql, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '条目不存在' });
    }

    // 记录活动日志
    await query(
      'INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details) VALUES ($1, $2, $3, $4, $5)',
      [userId, 'update_item', result.rows[0].type, id, { fields: Object.keys(req.body) }]
    );

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

/**
 * 删除条目（软删除）
 * DELETE /api/items/:id
 */
router.delete('/:id', async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: '未授权' });
    }

    const result = await query(
      'UPDATE items SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL RETURNING *',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '条目不存在' });
    }

    // 记录活动日志
    await query(
      'INSERT INTO activity_logs (user_id, action, entity_type, entity_id) VALUES ($1, $2, $3, $4)',
      [userId, 'delete_item', result.rows[0].type, id]
    );

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

/**
 * 归档条目
 * POST /api/items/:id/archive
 */
router.post('/:id/archive', async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: '未授权' });
    }

    const result = await query(
      'UPDATE items SET archived_at = CURRENT_TIMESTAMP WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL RETURNING *',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '条目不存在' });
    }

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

/**
 * 取消归档
 * POST /api/items/:id/unarchive
 */
router.post('/:id/unarchive', async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: '未授权' });
    }

    const result = await query(
      'UPDATE items SET archived_at = NULL WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL RETURNING *',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '条目不存在' });
    }

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;
