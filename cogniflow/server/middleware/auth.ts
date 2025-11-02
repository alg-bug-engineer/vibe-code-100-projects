import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// JWT 密钥（生产环境应从环境变量读取）
const JWT_SECRET = process.env.JWT_SECRET || 'cogniflow-secret-key-change-in-production';

// 扩展 Request 类型，添加 user 属性
export interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
    role: string;
  };
}

/**
 * 认证中间件
 * 验证请求中的 JWT token 并将用户信息添加到 req.user
 */
export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    // 从 Authorization header 中获取 token
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: '未授权：缺少认证令牌' 
      });
    }

    const token = authHeader.replace('Bearer ', '');

    // 验证 token
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as {
        userId: string;
        username: string;
        role: string;
      };

      // 将用户信息添加到请求对象
      req.user = {
        id: decoded.userId,
        username: decoded.username,
        role: decoded.role
      };

      next();
    } catch (jwtError) {
      return res.status(401).json({ 
        error: '未授权：无效的认证令牌' 
      });
    }
  } catch (error) {
    console.error('认证中间件错误:', error);
    return res.status(500).json({ 
      error: '服务器内部错误' 
    });
  }
}

/**
 * 可选认证中间件
 * 如果有 token 则验证，没有也允许通过（用于公开但可个性化的接口）
 */
export function optionalAuthMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // 没有 token，继续执行但不设置 user
      return next();
    }

    const token = authHeader.replace('Bearer ', '');

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as {
        userId: string;
        username: string;
        role: string;
      };

      req.user = {
        id: decoded.userId,
        username: decoded.username,
        role: decoded.role
      };
    } catch (jwtError) {
      // token 无效，但不阻止请求
      console.warn('可选认证：无效的令牌');
    }

    next();
  } catch (error) {
    console.error('可选认证中间件错误:', error);
    next();
  }
}

/**
 * 管理员权限中间件
 * 必须先经过 authMiddleware
 */
export function adminMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: '未授权' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: '权限不足：需要管理员权限' });
  }

  next();
}
