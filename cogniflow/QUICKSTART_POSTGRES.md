# 🚀 CogniFlow PostgreSQL 快速启动指南

## 📋 概述

本指南将帮助你在 5 分钟内将 CogniFlow 从 LocalStorage 切换到 PostgreSQL 数据库。

## ✅ 前提条件

- Docker 已安装并运行
- Node.js 和 pnpm 已安装
- 项目已克隆到本地

## 🎯 快速开始（3 步）

### 步骤 1: 启动数据库

```bash
# 启动 PostgreSQL 和 pgAdmin
docker-compose up -d

# 验证数据库
./scripts/verify-database.sh
```

**期望输出:**
```
✅ 数据库连接成功
✅ 表数量: 9
✅ 用户数量: 3
✅ 测试数据: 8 条
```

### 步骤 2: 启动 API 服务器

```bash
# 在新终端窗口中
cd server
pnpm tsx index.ts
```

**期望输出:**
```
🚀 CogniFlow API Server 已启动
📡 监听端口: 3001
🗄️  数据库: PostgreSQL
```

### 步骤 3: 测试 API

```bash
# 运行测试脚本
./scripts/test-api.sh
```

**期望输出:**
```
🎉 所有测试通过！API 服务器工作正常。
```

## 🔄 数据迁移（可选）

如果你有现有的 LocalStorage 数据需要迁移：

### 方法 1: 使用可视化工具（推荐）

1. 在浏览器中打开 `migrate.html`
2. 输入用户名和密码（默认: admin / admin123）
3. 点击"检查本地数据"查看现有数据
4. 点击"开始迁移"执行迁移

### 方法 2: 手动 API 调用

```bash
# 1. 登录获取 token
TOKEN=$(curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  | jq -r '.token')

# 2. 创建条目
curl -X POST http://localhost:3001/api/items \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "raw_text": "我的任务",
    "type": "task",
    "title": "完成项目",
    "priority": "high",
    "status": "pending",
    "tags": ["工作"]
  }'
```

## 🔧 切换到 PostgreSQL 模式

### 修改前端配置

编辑 `.env` 文件：

```bash
# 从 LocalStorage 切换到 PostgreSQL
VITE_STORAGE_MODE=postgres
VITE_API_URL=http://localhost:3001/api
```

### 重启前端

```bash
pnpm run dev
```

## 📊 验证运行状态

### 1. 检查数据库

```bash
# 使用 pgAdmin
# 访问: http://localhost:5050
# 邮箱: admin@example.com
# 密码: admin123

# 或使用命令行
docker exec -it cogniflow-postgres psql -U cogniflow_user -d cogniflow
```

### 2. 检查 API 健康

```bash
curl http://localhost:3001/health
# 输出: {"status":"healthy","timestamp":"..."}
```

### 3. 检查前端

访问 http://127.0.0.1:5173，应该可以：
- ✅ 登录系统
- ✅ 创建条目
- ✅ 查看条目列表
- ✅ 编辑和删除条目

## 🎨 默认测试账号

| 用户名 | 密码 | 角色 |
|--------|------|------|
| admin | admin123 | 管理员 |
| testuser1 | password123 | 普通用户 |
| testuser2 | password123 | 普通用户 |

## 📡 API 端点

### 认证
- `POST /api/auth/register` - 注册新用户
- `POST /api/auth/login` - 用户登录

### 用户
- `GET /api/users/me` - 获取当前用户信息
- `PUT /api/users/me` - 更新用户信息
- `POST /api/users/change-password` - 修改密码
- `GET /api/users/stats` - 获取用户统计

### 条目
- `GET /api/items` - 获取条目列表
- `POST /api/items` - 创建条目
- `GET /api/items/:id` - 获取单个条目
- `PUT /api/items/:id` - 更新条目
- `DELETE /api/items/:id` - 删除条目
- `POST /api/items/:id/archive` - 归档条目
- `POST /api/items/:id/unarchive` - 取消归档
- `POST /api/items/query` - 搜索条目
- `GET /api/items/calendar` - 获取日历事件
- `GET /api/items/tags/stats` - 获取标签统计
- `GET /api/items/history` - 获取历史记录

## 🛠️ 常见问题

### Q: API 服务器无法启动？

**A:** 检查以下几点：
1. 数据库是否正在运行: `docker ps`
2. 端口 3001 是否被占用: `lsof -i :3001`
3. 环境变量是否正确配置: `cat server/.env`

### Q: 数据库连接失败？

**A:** 确保：
1. Docker 容器正在运行: `docker-compose ps`
2. 数据库配置正确: 检查 `server/.env` 中的数据库凭据
3. 防火墙没有阻止连接

### Q: 前端无法连接 API？

**A:** 验证：
1. API 服务器正在运行: `curl http://localhost:3001/health`
2. CORS 配置正确: 检查 `server/index.ts` 中的 CORS 设置
3. 前端配置正确: 检查 `.env` 中的 `VITE_API_URL`

### Q: 如何重置数据库？

**A:** 运行以下命令：
```bash
docker-compose down -v  # 删除数据卷
docker-compose up -d    # 重新启动
```

## 🚦 服务器管理

### 启动服务

```bash
# 启动数据库
docker-compose up -d

# 启动 API 服务器
cd server && pnpm tsx index.ts &

# 启动前端
pnpm run dev
```

### 停止服务

```bash
# 停止前端（Ctrl+C）

# 停止 API 服务器
pkill -f "tsx index.ts"

# 停止数据库
docker-compose down
```

### 查看日志

```bash
# API 服务器日志（实时查看终端输出）

# 数据库日志
docker-compose logs postgres

# pgAdmin 日志
docker-compose logs pgadmin
```

## 📈 性能优化建议

1. **数据库索引**: 已自动创建 54 个索引，支持快速查询
2. **连接池**: 配置了 20 个并发连接
3. **缓存**: 考虑在前端添加 Redis 缓存层
4. **压缩**: 生产环境启用 gzip 压缩

## 🔐 安全建议

1. **修改默认密码**: 更改所有测试账号的密码
2. **更新 JWT 密钥**: 修改 `server/.env` 中的 `JWT_SECRET`
3. **配置防火墙**: 生产环境限制数据库访问
4. **启用 HTTPS**: 使用 SSL/TLS 加密通信
5. **定期备份**: 设置自动备份任务

## 📚 更多文档

- [数据库完整指南](./docs/DATABASE_GUIDE.md)
- [迁移实施指南](./DATABASE_MIGRATION_GUIDE.md)
- [迁移进度记录](./docs/DATABASE_MIGRATION_STATUS.md)
- [集成总结](./docs/DATABASE_INTEGRATION_SUMMARY.md)

## 🆘 获取帮助

如果遇到问题：
1. 查看上述常见问题
2. 运行测试脚本诊断: `./scripts/test-api.sh`
3. 检查日志输出
4. 提交 Issue 到项目仓库

---

**祝你使用愉快！** 🎉
