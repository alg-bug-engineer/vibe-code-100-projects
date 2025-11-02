# 数据库迁移实施指南

## 📋 当前状态

### ✅ 已完成
1. PostgreSQL 数据库环境（Docker）
2. 完整的数据库表结构设计
3. 数据库连接池
4. 前端 PostgreSQL API 客户端
5. 统一的 API 适配器

### 🚧 进行中
- 后端 Express API 服务器（部分完成）

### ⏳ 待完成
- 完善后端路由和中间件
- 认证系统集成
- 前端切换到 PostgreSQL 模式
- 数据迁移工具

## 🔄 架构设计

### 方案选择

我们采用**适配器模式**实现平滑迁移：

```
前端组件
    ↓
itemApi (统一接口)
    ↓
根据配置选择 →  LocalStorage API  或  PostgreSQL API
                     ↓                      ↓
                localStorage          HTTP → Express → PostgreSQL
```

### 优势
- ✅ 前端代码无需大量修改
- ✅ 可以通过配置开关切换
- ✅ 支持逐步迁移
- ✅ 向后兼容
- ✅ 易于测试和调试

## 🎯 实施步骤

### 阶段 1: 准备工作 ✅

1. ✅ 创建 PostgreSQL 数据库
2. ✅ 设计表结构
3. ✅ 创建数据库连接池
4. ✅ 创建前端 API 客户端
5. ✅ 创建配置管理

### 阶段 2: 后端 API 开发（当前）

需要完成以下文件：

#### 2.1 认证中间件
```typescript
// server/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
    role: string;
  };
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: '未授权' });
  }

  try {
    // 简化版：直接使用 user_id 作为 token
    // 生产环境应使用 JWT
    req.user = { id: token, username: '', role: 'user' };
    next();
  } catch (error) {
    res.status(401).json({ error: '无效的令牌' });
  }
}
```

#### 2.2 完整的服务器
```typescript
// server/index.ts
import express from 'express';
import cors from 'cors';
import itemsRouter from './routes/items.js';
import usersRouter from './routes/users.js';
import { authMiddleware } from './middleware/auth.js';

const app = express();

app.use(cors({ origin: 'http://127.0.0.1:5173', credentials: true }));
app.use(express.json());

// 公开路由
app.get('/health', async (req, res) => {
  res.json({ status: 'healthy' });
});

// 需要认证的路由
app.use('/api/items', authMiddleware, itemsRouter);
app.use('/api/users', authMiddleware, usersRouter);

app.listen(3001, () => {
  console.log('🚀 API 服务器启动在端口 3001');
});
```

#### 2.3 用户路由
```typescript
// server/routes/users.ts
import { Router } from 'express';
import { query } from '../db/pool.js';

const router = Router();

router.get('/me', async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const result = await query('SELECT * FROM users WHERE id = $1', [userId]);
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

export default router;
```

### 阶段 3: 前端切换

#### 3.1 修改环境变量
```env
# .env
VITE_STORAGE_MODE=postgres  # 或 local
VITE_API_URL=http://localhost:3001/api
```

#### 3.2 更新导入（已完成）
```typescript
// 所有组件都使用统一的 API
import { itemApi } from '@/db/apiAdapter';
```

### 阶段 4: 数据迁移

创建迁移工具：

```typescript
// scripts/migrate-data.ts
import { localItemApi } from '@/db/userDataApi';
import { postgresItemApi } from '@/db/postgresApi';

async function migrateData() {
  console.log('📦 开始迁移数据...');
  
  // 1. 从 LocalStorage 读取所有数据
  const localItems = await localItemApi.getItems();
  console.log(`找到 ${localItems.length} 条本地数据`);
  
  // 2. 批量写入 PostgreSQL
  for (const item of localItems) {
    try {
      await postgresItemApi.createItem(item);
      console.log(`✅ 迁移: ${item.title}`);
    } catch (error) {
      console.error(`❌ 失败: ${item.title}`, error);
    }
  }
  
  console.log('🎉 迁移完成！');
}
```

## 💡 快速开始

### 选项 A: 继续使用 LocalStorage（默认）

无需任何改动，当前就是这个模式。

### 选项 B: 切换到 PostgreSQL

1. **启动数据库**
```bash
docker-compose up -d
```

2. **安装后端依赖**
```bash
pnpm add pg express cors dotenv bcrypt jsonwebtoken
pnpm add -D @types/pg @types/express @types/cors @types/bcrypt @types/jsonwebtoken
```

3. **启动 API 服务器**
```bash
cd server
node --loader ts-node/esm index.ts
```

4. **配置前端使用 PostgreSQL**
```env
# .env
VITE_STORAGE_MODE=postgres
VITE_API_URL=http://localhost:3001/api
```

5. **重启前端**
```bash
pnpm run dev
```

## 📊 对比分析

| 特性 | LocalStorage | PostgreSQL |
|------|--------------|------------|
| 数据量限制 | 5-10MB | 无限制 |
| 跨设备同步 | ❌ | ✅ |
| 多用户支持 | 有限 | 完整 |
| 数据安全 | 低 | 高 |
| 查询能力 | 基础 | 强大 |
| 备份恢复 | 手动 | 自动 |
| 性能 | 快（小数据） | 快（大数据） |
| 部署复杂度 | 简单 | 中等 |
| 成本 | 免费 | 需服务器 |

## 🎯 建议

### 对于个人用户
- 继续使用 LocalStorage（默认）
- 简单、免费、无需服务器

### 对于团队/企业
- 切换到 PostgreSQL
- 多用户、数据同步、更安全

### 混合模式
- LocalStorage 作为离线缓存
- PostgreSQL 作为主存储
- 支持离线工作，在线同步

## 📝 待办清单

- [ ] 完成后端认证中间件
- [ ] 完成用户路由
- [ ] 添加错误处理和日志
- [ ] 创建数据迁移工具
- [ ] 添加单元测试
- [ ] 性能优化
- [ ] 安全加固
- [ ] 部署文档

## 🔧 开发命令

```bash
# 启动数据库
docker-compose up -d

# 验证数据库
./scripts/verify-database.sh

# 启动后端（待完成）
cd server && ts-node index.ts

# 启动前端
pnpm run dev

# 查看数据库
docker exec -it cogniflow-postgres psql -U cogniflow_user -d cogniflow
```

## 📚 相关文档

- [数据库快速启动](./DATABASE_QUICKSTART.md)
- [数据库完整指南](./DATABASE_GUIDE.md)
- [迁移进度](./DATABASE_MIGRATION_STATUS.md)
- [完成总结](./DATABASE_INTEGRATION_SUMMARY.md)

## 🤝 贡献指南

如果你想完成后端开发，可以：

1. Fork 项目
2. 完成 `server/` 目录下的代码
3. 测试功能
4. 提交 Pull Request

或者联系项目维护者协助完成。

---

**当前推荐**: 保持使用 LocalStorage，数据库作为可选升级方案。

**未来计划**: 完成后端 API 后，提供平滑的迁移工具。
