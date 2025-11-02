# CogniFlow PostgreSQL 数据库 - 快速启动

## 🚀 5分钟快速启动

### 步骤 1: 启动数据库

```bash
cd /Users/zhangqilai/project/vibe-code-100-projects/cogniflow

# 启动 Docker 容器
docker-compose up -d

# 等待几秒钟让数据库初始化
sleep 5

# 检查状态
docker-compose ps
```

预期输出：
```
NAME                   IMAGE                  STATUS
cogniflow-postgres     postgres:16-alpine     Up (healthy)
cogniflow-pgadmin      dpage/pgadmin4:latest  Up
```

### 步骤 2: 验证数据库

```bash
# 连接数据库并查看表
docker exec -it cogniflow-postgres psql -U cogniflow_user -d cogniflow -c "\dt"
```

预期输出：
```
                List of relations
 Schema |       Name        | Type  |     Owner      
--------+-------------------+-------+----------------
 public | activity_logs     | table | cogniflow_user
 public | backups           | table | cogniflow_user
 public | items             | table | cogniflow_user
 public | sessions          | table | cogniflow_user
 public | system_logs       | table | cogniflow_user
 public | tags              | table | cogniflow_user
 public | user_settings     | table | cogniflow_user
 public | user_statistics   | table | cogniflow_user
 public | users             | table | cogniflow_user
```

### 步骤 3: 测试登录

使用以下测试账号：

**管理员账号**:
- 用户名: `admin`
- 密码: `admin123`

**普通用户账号**:
- 用户名: `testuser1`  
- 密码: `password123`

```bash
# 查看用户列表
docker exec -it cogniflow-postgres psql -U cogniflow_user -d cogniflow -c "SELECT username, email, role FROM users;"
```

### 步骤 4: 访问 pgAdmin (可选)

1. 打开浏览器访问: http://localhost:5050
2. 登录:
   - 邮箱: `admin@example.com`
   - 密码: `admin123`
3. 添加服务器:
   - 名称: `CogniFlow`
   - 主机: `postgres` (Docker 网络内部名称)
   - 端口: `5432`
   - 数据库: `cogniflow`
   - 用户名: `cogniflow_user`
   - 密码: `cogniflow_password_2024`

## 📊 查看数据

```bash
# 查看所有用户
docker exec -it cogniflow-postgres psql -U cogniflow_user -d cogniflow -c "SELECT * FROM users;"

# 查看所有条目
docker exec -it cogniflow-postgres psql -U cogniflow_user -d cogniflow -c "SELECT id, type, title, status FROM items LIMIT 10;"

# 查看用户统计
docker exec -it cogniflow-postgres psql -U cogniflow_user -d cogniflow -c "SELECT * FROM user_overview;"

# 查看活跃用户
docker exec -it cogniflow-postgres psql -U cogniflow_user -d cogniflow -c "SELECT * FROM active_users_stats;"
```

## 🛑 停止数据库

```bash
# 停止容器（保留数据）
docker-compose stop

# 停止并删除容器（保留数据卷）
docker-compose down

# 完全清除（⚠️ 会删除所有数据）
docker-compose down -v
```

## 🔄 重启数据库

```bash
# 重启服务
docker-compose restart

# 或者完全重启
docker-compose down
docker-compose up -d
```

## 📝 常见问题

### 1. 端口被占用

错误: `Error starting userland proxy: listen tcp4 0.0.0.0:5432: bind: address already in use`

解决方案:
```bash
# 查找占用端口的进程
lsof -i :5432

# 修改 docker-compose.yml 中的端口映射
ports:
  - "5433:5432"  # 改用 5433 端口
```

### 2. 容器无法启动

```bash
# 查看详细日志
docker-compose logs postgres

# 检查 Docker 状态
docker ps -a

# 重新构建
docker-compose down -v
docker-compose up -d --force-recreate
```

### 3. 无法连接数据库

```bash
# 检查容器健康状态
docker-compose ps

# 测试连接
docker exec cogniflow-postgres pg_isready -U cogniflow_user -d cogniflow

# 查看 PostgreSQL 日志
docker-compose logs postgres | tail -50
```

## 🎯 下一步

1. ✅ 数据库已启动并运行
2. ⏭️ 安装 Node.js 依赖: `./scripts/install-db-deps.sh`
3. ⏭️ 开发 API 服务器 (见 `DATABASE_MIGRATION_STATUS.md`)
4. ⏭️ 修改前端代码以使用新 API
5. ⏭️ 迁移现有数据

## 📚 更多文档

- [完整数据库指南](./DATABASE_GUIDE.md)
- [迁移状态](./DATABASE_MIGRATION_STATUS.md)
- [表结构](./database/init/01_schema.sql)

## 💬 需要帮助？

查看日志获取更多信息:
```bash
# PostgreSQL 日志
docker-compose logs -f postgres

# pgAdmin 日志
docker-compose logs -f pgadmin

# 所有服务日志
docker-compose logs -f
```

---

**提示**: 首次启动可能需要 10-30 秒来初始化数据库和执行脚本。
