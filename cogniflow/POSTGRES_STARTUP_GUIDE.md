# 🚀 CogniFlow PostgreSQL 模式启动指南

## ✅ 当前配置

**存储模式**: PostgreSQL  
**API 地址**: http://localhost:3001/api  
**配置文件**: `.env`

---

## 📝 启动步骤

### 步骤 1: 启动 PostgreSQL 数据库

```bash
# 确保在项目根目录
cd /Users/zhangqilai/project/vibe-code-100-projects/cogniflow

# 启动数据库容器
docker-compose up -d

# 验证数据库状态
docker-compose ps
```

**期望输出**:
```
NAME                    STATUS          PORTS
cogniflow-postgres      Up              0.0.0.0:5432->5432/tcp
cogniflow-pgadmin       Up              0.0.0.0:5050->80/tcp
```

### 步骤 2: 启动后端 API 服务器

**打开新的终端窗口**，执行：

```bash
# 进入 server 目录
cd /Users/zhangqilai/project/vibe-code-100-projects/cogniflow/server

# 启动 API 服务器
pnpm tsx index.ts
```

**期望输出**:
```
🚀 CogniFlow API Server 已启动
📡 监听端口: 3001
🌐 前端地址: http://127.0.0.1:5173
🗄️  数据库: PostgreSQL
📝 环境: development

📋 可用端点:
  - POST /api/auth/register  (注册)
  - POST /api/auth/login     (登录)
  - GET  /api/users/me       (获取用户信息)
  - GET  /api/items          (获取条目列表)
  - POST /api/items          (创建条目)
  - GET  /health             (健康检查)
```

**保持此终端运行！** API 服务器需要持续运行。

### 步骤 3: 启动前端开发服务器

**打开第三个终端窗口**，执行：

```bash
# 返回项目根目录
cd /Users/zhangqilai/project/vibe-code-100-projects/cogniflow

# 启动前端
pnpm run dev
```

**期望输出**:
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://127.0.0.1:5173/
➜  Network: use --host to expose
➜  press h to show help

🔌 使用 PostgreSQL 数据存储
```

### 步骤 4: 访问应用

打开浏览器访问: **http://127.0.0.1:5173**

---

## 🔐 首次使用

### 1. 注册新账号

在登录页面：
1. 点击「注册」标签页
2. 输入用户名（至少 3 个字符）
3. 输入邮箱
4. 设置密码（至少 6 个字符）
5. 点击「注册」按钮

### 2. 或使用测试账号

| 用户名 | 密码 | 角色 |
|--------|------|------|
| admin | admin123 | 管理员 |
| testuser1 | password123 | 普通用户 |

---

## 🧪 验证运行状态

### 检查数据库

```bash
# 方法 1: 运行验证脚本
./scripts/verify-database.sh
```

**期望输出**:
```
✅ 数据库连接成功
✅ 表数量: 9
✅ 用户数量: 3
✅ 测试数据: 8 条
```

### 检查 API 服务器

```bash
# 方法 2: 测试 API
./scripts/test-api.sh
```

**期望输出**:
```
🎉 所有测试通过！API 服务器工作正常。
```

### 检查前端连接

打开浏览器控制台（F12），应该看到：
```
🔌 使用 PostgreSQL 数据存储
```

---

## 🛑 停止服务

### 停止前端（终端 3）
按 `Ctrl + C`

### 停止 API 服务器（终端 2）
按 `Ctrl + C`

### 停止数据库（终端 1）
```bash
docker-compose down
```

**如果需要清空数据**:
```bash
docker-compose down -v  # -v 参数会删除数据卷
```

---

## 🔄 重启服务

如果需要重启某个服务：

```bash
# 重启数据库
docker-compose restart postgres

# 重启 API 服务器
# 在 server 目录终端按 Ctrl+C 后重新运行
cd server && pnpm tsx index.ts

# 重启前端
# 在项目根目录终端按 Ctrl+C 后重新运行
pnpm run dev
```

---

## 📊 服务端口一览

| 服务 | 端口 | 用途 |
|------|------|------|
| 前端 | 5173 | Web 应用界面 |
| API | 3001 | 后端 REST API |
| PostgreSQL | 5432 | 数据库服务 |
| pgAdmin | 5050 | 数据库管理工具 |

---

## 🔍 常见问题

### Q1: API 服务器无法启动？

**检查数据库是否运行**:
```bash
docker ps | grep cogniflow-postgres
```

如果没有输出，执行：
```bash
docker-compose up -d
```

### Q2: 前端无法连接 API？

**检查 API 服务器是否运行**:
```bash
curl http://localhost:3001/health
```

应该返回: `{"status":"healthy"}`

### Q3: 登录失败？

**检查控制台错误信息**:
1. 打开浏览器 F12 控制台
2. 尝试登录
3. 查看红色错误信息

**可能原因**:
- API 服务器未启动
- 数据库连接失败
- 用户名密码错误

### Q4: 数据没有保存？

**确认使用 PostgreSQL 模式**:
查看浏览器控制台是否显示：
```
🔌 使用 PostgreSQL 数据存储
```

如果显示 `LocalStorage`，检查 `.env` 文件：
```bash
cat .env | grep STORAGE_MODE
```

应该是: `VITE_STORAGE_MODE=postgres`

---

## 🎨 开发工具

### pgAdmin 数据库管理

访问: http://localhost:5050

**登录信息**:
- 邮箱: `admin@example.com`
- 密码: `admin123`

**连接数据库**:
- Host: `postgres` (容器名)
- Port: `5432`
- Database: `cogniflow`
- Username: `cogniflow_user`
- Password: `cogniflow_password`

### API 测试工具

推荐使用:
- **cURL** (命令行)
- **Postman** (图形界面)
- **Thunder Client** (VS Code 插件)

**示例请求**:
```bash
# 获取健康状态
curl http://localhost:3001/health

# 用户登录
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# 获取条目列表（需要 token）
curl http://localhost:3001/api/items \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 📚 相关文档

- [快速启动指南](./QUICKSTART_POSTGRES.md)
- [数据库完整指南](./docs/DATABASE_GUIDE.md)
- [API 文档](./server/README.md)
- [故障排除](./TROUBLESHOOTING.md)

---

## 💡 提示

### 开发流程

1. **首次启动**: 按照上述步骤 1-4 启动所有服务
2. **日常开发**: 
   - 数据库可以一直运行（`docker-compose up -d`）
   - API 服务器保持终端运行
   - 前端支持热重载，修改代码自动刷新
3. **停止开发**: 
   - 前端和 API 服务器按 Ctrl+C
   - 数据库可以保持运行，或 `docker-compose down`

### 性能优化

- 数据库连接池已配置（20 个连接）
- 54 个索引已创建，查询速度快
- GIN 全文搜索索引支持复杂查询

### 数据安全

- 密码使用 bcrypt 加密
- JWT token 7 天有效期
- 软删除机制，数据可恢复

---

**祝你开发愉快！** 🎉

如有问题，请运行测试脚本诊断：
```bash
./scripts/test-api.sh
```
