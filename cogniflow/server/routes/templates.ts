import { Router } from 'express';
import type { Response } from 'express';
import pool from '../db/pool';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// 获取用户的所有模板
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    console.log('📝 获取用户模板, userId:', userId);
    
    const result = await pool.query(
      `SELECT * FROM user_templates 
       WHERE user_id = $1 
       ORDER BY sort_order ASC, created_at DESC`,
      [userId]
    );

    console.log('✅ 找到', result.rows.length, '个模板');
    res.json(result.rows);
  } catch (error) {
    console.error('❌ 获取模板失败:', error);
    res.status(500).json({ error: '获取模板失败' });
  }
});

// 获取单个模板
router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    
    const result = await pool.query(
      `SELECT * FROM user_templates 
       WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '模板不存在' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('获取模板失败:', error);
    res.status(500).json({ error: '获取模板失败' });
  }
});

// 创建新模板
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const {
      trigger_word,
      template_name,
      icon,
      collection_type,
      default_tags,
      default_sub_items,
      color,
      sort_order,
    } = req.body;

    // 验证必填字段
    if (!trigger_word || !template_name || !collection_type) {
      return res.status(400).json({ error: '缺少必填字段' });
    }

    // 检查触发词是否重复
    const existingTemplate = await pool.query(
      `SELECT id FROM user_templates 
       WHERE user_id = $1 AND trigger_word = $2`,
      [userId, trigger_word]
    );

    if (existingTemplate.rows.length > 0) {
      return res.status(400).json({ error: '触发词已存在' });
    }

    const result = await pool.query(
      `INSERT INTO user_templates (
        user_id, trigger_word, template_name, icon, collection_type,
        default_tags, default_sub_items, color, sort_order
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        userId,
        trigger_word,
        template_name,
        icon || '📝',
        collection_type,
        default_tags || [],
        JSON.stringify(default_sub_items || []),
        color,
        sort_order || 0,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('创建模板失败:', error);
    res.status(500).json({ error: '创建模板失败' });
  }
});

// 更新模板
router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const {
      trigger_word,
      template_name,
      icon,
      collection_type,
      default_tags,
      default_sub_items,
      color,
      is_active,
      sort_order,
    } = req.body;

    // 验证模板所有权
    const ownerCheck = await pool.query(
      `SELECT id FROM user_templates WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (ownerCheck.rows.length === 0) {
      return res.status(404).json({ error: '模板不存在' });
    }

    // 如果修改了触发词，检查是否重复
    if (trigger_word) {
      const duplicateCheck = await pool.query(
        `SELECT id FROM user_templates 
         WHERE user_id = $1 AND trigger_word = $2 AND id != $3`,
        [userId, trigger_word, id]
      );

      if (duplicateCheck.rows.length > 0) {
        return res.status(400).json({ error: '触发词已存在' });
      }
    }

    const result = await pool.query(
      `UPDATE user_templates 
       SET 
         trigger_word = COALESCE($1, trigger_word),
         template_name = COALESCE($2, template_name),
         icon = COALESCE($3, icon),
         collection_type = COALESCE($4, collection_type),
         default_tags = COALESCE($5, default_tags),
         default_sub_items = COALESCE($6, default_sub_items),
         color = COALESCE($7, color),
         is_active = COALESCE($8, is_active),
         sort_order = COALESCE($9, sort_order),
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $10 AND user_id = $11
       RETURNING *`,
      [
        trigger_word,
        template_name,
        icon,
        collection_type,
        default_tags,
        default_sub_items ? JSON.stringify(default_sub_items) : null,
        color,
        is_active,
        sort_order,
        id,
        userId,
      ]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('更新模板失败:', error);
    res.status(500).json({ error: '更新模板失败' });
  }
});

// 删除模板
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    const result = await pool.query(
      `DELETE FROM user_templates 
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '模板不存在' });
    }

    res.json({ message: '删除成功', id: result.rows[0].id });
  } catch (error) {
    console.error('删除模板失败:', error);
    res.status(500).json({ error: '删除模板失败' });
  }
});

// 增加模板使用次数
router.post('/:id/increment-usage', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE user_templates 
       SET usage_count = usage_count + 1
       WHERE id = $1 AND user_id = $2
       RETURNING usage_count`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '模板不存在' });
    }

    res.json({ usage_count: result.rows[0].usage_count });
  } catch (error) {
    console.error('更新使用次数失败:', error);
    res.status(500).json({ error: '更新使用次数失败' });
  }
});

export default router;
