# 🚀 CogniFlow 启动方式说明

## 📋 两种存储模式对比

### LocalStorage 模式（默认）
```bash
# 只需一个命令
pnpm run dev
```
- ✅ **简单**: 一个命令启动
- ✅ **快速**: 无需数据库
- ❌ **限制**: 数据只在浏览器本地，无法跨设备

### PostgreSQL 模式（企业级）
需要启动 **2个服务**：
```bash
# 方式1: 分别启动（两个终端）
cd server && pnpm tsx index.ts  # 终端1: API服务器
pnpm run dev                    # 终端2: 前端应用

# 方式2: 一键启动（推荐）
pnpm run dev:postgres           # 自动启动所有服务
```
- ✅ **功能强大**: 跨设备同步
- ✅ **多用户**: 支持协作
- ⚠️ **需要**: 数据库 + API服务器 + 前端

---

## 🎯 推荐启动方式

### 方案 A: 一键启动（最简单）⭐

```bash
# 1. 确保数据库运行
docker-compose up -d

# 2. 一键启动所有服务
pnpm run dev:postgres
```

**效果**:
- 🔵 API 服务器自动启动（端口 3001）
- 🟣 前端应用自动启动（端口 5173）
- 📊 两个服务的日志会以不同颜色显示

**停止**: 按 `Ctrl + C` 会同时停止两个服务

---

### 方案 B: 分别启动（更灵活）

适合需要单独查看每个服务日志的情况。

**终端 1: API 服务器**
```bash
cd server
pnpm tsx index.ts
```
保持运行，会看到：
```
🚀 CogniFlow API Server 已启动
📡 监听端口: 3001
```

**终端 2: 前端应用**
```bash
pnpm run dev
```
保持运行，会看到：
```
VITE v5.x.x  ready in xxx ms
➜  Local:   http://127.0.0.1:5173/
```

**停止**: 在每个终端分别按 `Ctrl + C`

---

## 🔄 完整启动流程

### 首次启动

```bash
# 1. 启动数据库（只需第一次或停止后）
docker-compose up -d

# 2. 验证数据库
docker-compose ps  # 应该看到 postgres 和 pgadmin 在运行

# 3. 启动应用（选择一种方式）
pnpm run dev:postgres  # 一键启动
# 或
cd server && pnpm tsx index.ts  # 终端1
pnpm run dev                    # 终端2
```

### 日常开发

如果数据库一直在后台运行：
```bash
pnpm run dev:postgres  # 直接启动即可
```

---

## 🛑 停止服务

### 停止应用服务
```bash
# 如果使用 dev:postgres
按 Ctrl + C  # 会同时停止 API 和前端

# 如果分开启动
在每个终端按 Ctrl + C
```

### 停止数据库
```bash
docker-compose down  # 停止但保留数据
docker-compose down -v  # 停止并删除数据（慎用）
```

---

## 📊 服务架构

```
┌─────────────────────────────────────┐
│  数据库层                            │
│  docker-compose up -d               │
│  ┌─────────────┐  ┌──────────────┐ │
│  │ PostgreSQL  │  │   pgAdmin    │ │
│  │  port 5432  │  │  port 5050   │ │
│  └─────────────┘  └──────────────┘ │
└─────────────────────────────────────┘
              ↑
              │ SQL 查询
              │
┌─────────────────────────────────────┐
│  API 层（必须启动）                   │
│  cd server && pnpm tsx index.ts     │
│  ┌─────────────────────────────┐   │
│  │   Express API Server        │   │
│  │   http://localhost:3001     │   │
│  │   - 处理认证                 │   │
│  │   - 处理业务逻辑             │   │
│  │   - 数据库操作               │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
              ↑
              │ HTTP REST API
              │
┌─────────────────────────────────────┐
│  前端层（必须启动）                   │
│  pnpm run dev                       │
│  ┌─────────────────────────────┐   │
│  │   React App (Vite)          │   │
│  │   http://127.0.0.1:5173     │   │
│  │   - 用户界面                 │   │
│  │   - 发送 API 请求            │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
              ↑
              │
          浏览器访问
```

---

## 💡 常见问题

### Q1: 为什么需要启动两个服务？

**A**: 这是前后端分离架构：
- **前端**: 负责用户界面（React）
- **后端**: 负责业务逻辑和数据库交互（Express）
- **好处**: 
  - 前端可以独立开发和部署
  - 后端可以被多个客户端使用（Web、App等）
  - 更安全（数据库不直接暴露给前端）

### Q2: LocalStorage 模式为什么只需一个服务？

**A**: LocalStorage 模式下，数据直接存在浏览器里：
```
浏览器 → 前端 → LocalStorage（浏览器）
```
不需要 API 服务器和数据库。

### Q3: 能否只启动一个服务？

**A**: PostgreSQL 模式必须同时启动：
- ❌ 只启动前端 → 无法获取数据（API 调用失败）
- ❌ 只启动后端 → 无法访问界面

两者必须配合工作。

### Q4: 数据库需要一直运行吗？

**A**: Docker 数据库可以选择：
- **保持运行**: `docker-compose up -d`（推荐）
  - 优点: 下次启动快
  - 缺点: 占用少量资源
- **用时再启动**: 每次开发前执行 `docker-compose up -d`
  - 优点: 不占用资源
  - 缺点: 每次启动慢几秒

### Q5: 如何知道服务是否正常？

**A**: 检查方法：
```bash
# 1. 数据库
docker ps | grep cogniflow

# 2. API 服务器
curl http://localhost:3001/health

# 3. 前端
打开 http://127.0.0.1:5173
```

---

## 🎨 开发工作流

### 正常开发流程

```bash
# 第一次
1. docker-compose up -d        # 启动数据库（只需一次）
2. pnpm run dev:postgres       # 启动应用
3. 开始开发...
4. Ctrl + C                    # 结束开发

# 以后每次
pnpm run dev:postgres          # 直接启动
```

### 前端修改（热重载）
- 修改 React 组件 → 自动刷新
- 无需重启服务

### 后端修改
- 修改 API 代码 → 需要重启
- `Ctrl + C` 然后重新运行

---

## 📚 相关命令速查

| 操作 | 命令 |
|------|------|
| 一键启动 | `pnpm run dev:postgres` |
| 启动数据库 | `docker-compose up -d` |
| 检查数据库 | `docker-compose ps` |
| 停止数据库 | `docker-compose down` |
| 测试 API | `./scripts/test-api.sh` |
| 验证数据库 | `./scripts/verify-database.sh` |
| API 健康检查 | `curl http://localhost:3001/health` |

---

## 🆚 两种模式选择

### 选择 LocalStorage 如果你：
- ✅ 只是个人使用
- ✅ 不需要跨设备同步
- ✅ 想要快速开始
- ✅ 不想管理数据库

**启动**: `pnpm run dev`

### 选择 PostgreSQL 如果你：
- ✅ 需要跨设备访问
- ✅ 多人协作
- ✅ 需要数据备份
- ✅ 企业级应用

**启动**: `pnpm run dev:postgres`

---

**提示**: 可以随时切换模式，只需修改 `.env` 中的 `VITE_STORAGE_MODE`！

**最后更新**: 2025年11月1日
