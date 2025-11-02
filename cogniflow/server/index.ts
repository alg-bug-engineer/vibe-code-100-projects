/**
 * Express API Server for CogniFlow
 * 连接 PostgreSQL 数据库，为前端提供 RESTful API
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './db/pool.js';
import itemsRouter from './routes/items.js';
import usersRouter from './routes/users.js';
import templatesRouter from './routes/templates.js';
import { authMiddleware } from './middleware/auth.js';

// 加载环境变量
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://127.0.0.1:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 请求日志
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.path}`);
  next();
});

// 健康检查
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
  } catch (error: any) {
    res.status(500).json({ status: 'unhealthy', error: error?.message || 'Unknown error' });
  }
});

// API 路由
app.get('/api', (req, res) => {
  res.json({
    message: 'CogniFlow API Server',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth/*',
      items: '/api/items/*',
      users: '/api/users/*',
      tags: '/api/tags/*',
      statistics: '/api/statistics/*'
    }
  });
});

// 公开路由（不需要认证）
app.use('/api/auth', usersRouter); // 注册和登录

// 需要认证的路由
app.use('/api/items', authMiddleware, itemsRouter);
app.use('/api/users', authMiddleware, usersRouter);
app.use('/api/templates', authMiddleware, templatesRouter);

// 错误处理中间件
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ 错误:', err);
  res.status(err.status || 500).json({
    error: err.message || '服务器内部错误',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 处理
app.use((req, res) => {
  res.status(404).json({ error: '接口不存在' });
});

// 启动服务器
app.listen(PORT, () => {
  console.log('🚀 CogniFlow API Server 已启动');
  console.log(`📡 监听端口: ${PORT}`);
  console.log(`🌐 前端地址: ${process.env.FRONTEND_URL || 'http://127.0.0.1:5173'}`);
  console.log(`🗄️  数据库: PostgreSQL`);
  console.log(`📝 环境: ${process.env.NODE_ENV || 'development'}`);
  console.log('');
  console.log('📋 可用端点:');
  console.log('  - POST /api/auth/register  (注册)');
  console.log('  - POST /api/auth/login     (登录)');
  console.log('  - GET  /api/users/me       (获取用户信息)');
  console.log('  - GET  /api/items          (获取条目列表)');
  console.log('  - POST /api/items          (创建条目)');
  console.log('  - GET  /health             (健康检查)');
});

// 优雅关闭
process.on('SIGTERM', async () => {
  console.log('收到 SIGTERM 信号，正在关闭服务器...');
  await pool.end();
  process.exit(0);
});

export default app;
