/**
 * Users and Authentication API Routes
 * 处理用户和认证相关的请求
 */

import { Router, Request, Response, NextFunction } from 'express';
import { query } from '../db/pool.js';
import { AuthRequest } from '../middleware/auth.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'cogniflow-secret-key-change-in-production';
const SALT_ROUNDS = 10;

/**
 * 用户注册
 * POST /api/auth/register
 */
router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, password, email } = req.body;

    // 验证必填字段
    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码为必填项' });
    }

    // 检查用户名是否已存在
    const existingUser = await query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: '用户名已存在' });
    }

    // 加密密码
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // 创建用户
    const result = await query(
      `INSERT INTO users (username, password_hash, email, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, username, email, role, created_at`,
      [username, passwordHash, email || null, 'user']
    );

    const user = result.rows[0];

    // 为新用户创建默认模板
    try {
      const defaultTemplates = [
        {
          trigger_word: '日报',
          template_name: '每日工作日志',
          icon: '📰',
          collection_type: '日报',
          default_tags: ['工作', '日报'],
          default_sub_items: [
            { id: '1', text: '总结今日完成的工作', status: 'pending' },
            { id: '2', text: '记录遇到的问题', status: 'pending' },
            { id: '3', text: '规划明日工作计划', status: 'pending' },
          ],
          sort_order: 0,
        },
        {
          trigger_word: '会议',
          template_name: '会议纪要',
          icon: '👥',
          collection_type: '会议',
          default_tags: ['会议', '工作'],
          default_sub_items: [
            { id: '1', text: '记录会议议题', status: 'pending' },
            { id: '2', text: '记录讨论要点', status: 'pending' },
            { id: '3', text: '记录行动项', status: 'pending' },
          ],
          sort_order: 1,
        },
        {
          trigger_word: '月报',
          template_name: '月度总结',
          icon: '📅',
          collection_type: '月报',
          default_tags: ['工作', '月报'],
          default_sub_items: [
            { id: '1', text: '本月工作完成情况', status: 'pending' },
            { id: '2', text: '重点成果与亮点', status: 'pending' },
            { id: '3', text: '下月工作计划', status: 'pending' },
          ],
          sort_order: 2,
        },
      ];

      for (const template of defaultTemplates) {
        await query(
          `INSERT INTO user_templates (
            user_id, trigger_word, template_name, icon, collection_type,
            default_tags, default_sub_items, is_active, sort_order
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            user.id,
            template.trigger_word,
            template.template_name,
            template.icon,
            template.collection_type,
            template.default_tags,
            JSON.stringify(template.default_sub_items),
            true,
            template.sort_order,
          ]
        );
      }
      console.log(`✅ 为新用户 ${user.username} 创建了默认模板`);
    } catch (templateError) {
      console.error('创建默认模板失败:', templateError);
      // 不中断注册流程，只记录错误
    }

    // 生成 JWT token
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: '注册成功',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.created_at
      },
      token
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 用户登录
 * POST /api/auth/login
 */
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, password } = req.body;

    // 验证必填字段
    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码为必填项' });
    }

    // 查找用户
    const result = await query(
      'SELECT id, username, email, password_hash, role FROM users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    const user = result.rows[0];

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    // 更新最后登录时间
    await query(
      'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    // 生成 JWT token
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: '登录成功',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 获取当前用户信息
 * GET /api/users/me
 * 需要认证
 */
router.get('/me', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: '未授权' });
    }

    const result = await query(
      'SELECT id, username, email, role, created_at, last_login_at FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '用户不存在' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

/**
 * 更新用户信息
 * PUT /api/users/me
 * 需要认证
 */
router.put('/me', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { email } = req.body;

    if (!userId) {
      return res.status(401).json({ error: '未授权' });
    }

    const result = await query(
      `UPDATE users SET email = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, username, email, role`,
      [email, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '用户不存在' });
    }

    res.json({
      message: '更新成功',
      user: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 修改密码
 * POST /api/users/change-password
 * 需要认证
 */
router.post('/change-password', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { oldPassword, newPassword } = req.body;

    if (!userId) {
      return res.status(401).json({ error: '未授权' });
    }

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: '旧密码和新密码为必填项' });
    }

    // 获取当前密码哈希
    const result = await query(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '用户不存在' });
    }

    // 验证旧密码
    const isOldPasswordValid = await bcrypt.compare(
      oldPassword,
      result.rows[0].password_hash
    );

    if (!isOldPasswordValid) {
      return res.status(401).json({ error: '旧密码错误' });
    }

    // 加密新密码
    const newPasswordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // 更新密码
    await query(
      `UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [newPasswordHash, userId]
    );

    res.json({ message: '密码修改成功' });
  } catch (error) {
    next(error);
  }
});

/**
 * 获取用户统计信息
 * GET /api/users/stats
 * 需要认证
 */
router.get('/stats', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: '未授权' });
    }

    // 获取用户统计数据
    const statsResult = await query(
      'SELECT * FROM user_statistics WHERE user_id = $1',
      [userId]
    );

    // 获取条目统计
    const itemsResult = await query(
      `SELECT 
        COUNT(*) FILTER (WHERE type = 'task') as task_count,
        COUNT(*) FILTER (WHERE type = 'event') as event_count,
        COUNT(*) FILTER (WHERE type = 'note') as note_count,
        COUNT(*) FILTER (WHERE type = 'url') as url_count,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
        COUNT(*) FILTER (WHERE archived_at IS NOT NULL) as archived_count
       FROM items 
       WHERE user_id = $1 AND deleted_at IS NULL`,
      [userId]
    );

    res.json({
      statistics: statsResult.rows[0] || null,
      itemStats: itemsResult.rows[0]
    });
  } catch (error) {
    next(error);
  }
});

export default router;
