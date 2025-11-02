# PostgreSQL 数据库集成指南

## 概述

CogniFlow 已从本地存储迁移到 PostgreSQL 数据库，提供更强大和可靠的数据管理能力。

## 快速开始

### 1. 安装依赖

```bash
cd /Users/zhangqilai/project/vibe-code-100-projects/cogniflow
./scripts/install-db-deps.sh
```

或手动安装：

```bash
pnpm add pg express cors dotenv bcrypt jsonwebtoken
pnpm add -D @types/pg @types/express @types/cors @types/bcrypt @types/jsonwebtoken
```

### 2. 启动数据库

```bash
# 启动 PostgreSQL 和 pgAdmin
docker-compose up -d

# 查看日志
docker-compose logs -f postgres

# 检查容器状态
docker-compose ps
```

### 3. 验证数据库

数据库启动后会自动执行初始化脚本：
- `database/init/01_schema.sql` - 创建表结构
- `database/init/02_test_data.sql` - 插入测试数据

## 数据库访问

### PostgreSQL 数据库
- **主机**: localhost
- **端口**: 5432
- **数据库**: cogniflow
- **用户名**: cogniflow_user
- **密码**: cogniflow_password_2024

### pgAdmin Web 界面
- **URL**: http://localhost:5050
- **邮箱**: admin@example.com
- **密码**: admin123

### 默认账号

**管理员账号**:
- 用户名: admin
- 密码: admin123

**测试账号**:
- 用户名: testuser1
- 密码: password123

## 数据库结构

### 核心表

#### 1. users - 用户表
```sql
- id: UUID (主键)
- username: 用户名 (唯一)
- email: 邮箱 (唯一)
- phone: 手机号 (唯一)
- password_hash: 密码哈希
- role: 角色 (user/admin)
- avatar_url: 头像URL
- status: 状态 (active/inactive/suspended)
- created_at, updated_at, last_login_at: 时间戳
```

#### 2. items - 条目表
```sql
- id: UUID (主键)
- user_id: 用户ID (外键)
- raw_text: 原始文本
- type: 类型 (task/event/note/data/url)
- title: 标题
- description: 描述
- due_date: 截止日期
- priority: 优先级 (high/medium/low)
- status: 状态 (pending/in-progress/blocked/completed)

-- 日程相关
- start_time, end_time: 开始/结束时间
- has_conflict: 是否冲突
- recurrence_rule: 重复规则
- recurrence_end_date: 重复结束日期
- master_item_id: 主条目ID
- is_master: 是否主条目

-- URL 相关
- url, url_title, url_summary, url_thumbnail, url_fetched_at

-- 元数据
- tags: 标签数组
- entities: JSON 实体
- archived_at, deleted_at: 归档/删除时间
- created_at, updated_at: 时间戳
```

#### 3. tags - 标签表
```sql
- id: UUID (主键)
- user_id: 用户ID (外键)
- name: 标签名
- color: 颜色
- usage_count: 使用次数
- created_at, updated_at: 时间戳
```

#### 4. user_settings - 用户设置表
```sql
- id: UUID (主键)
- user_id: 用户ID (外键, 唯一)
- theme: 主题 (light/dark/system)
- language: 语言
- notifications_enabled: 通知开关
- email_notifications: 邮件通知开关
- timezone: 时区
- settings_data: JSONB 额外设置
- created_at, updated_at: 时间戳
```

#### 5. activity_logs - 活动日志表
```sql
- id: UUID (主键)
- user_id: 用户ID (外键)
- action: 操作类型
- entity_type: 实体类型
- entity_id: 实体ID
- details: JSONB 详情
- ip_address: IP地址
- user_agent: 用户代理
- created_at: 时间戳
```

#### 6. user_statistics - 用户统计表
```sql
- id: UUID (主键)
- user_id: 用户ID (外键)
- date: 日期
- total_items: 总条目数
- tasks_created: 创建任务数
- tasks_completed: 完成任务数
- events_created: 创建日程数
- notes_created: 创建笔记数
- urls_saved: 保存链接数
- login_count: 登录次数
- active_minutes: 活跃分钟数
- detailed_stats: JSONB 详细统计
- created_at, updated_at: 时间戳
```

#### 7. system_logs - 系统日志表
```sql
- id: UUID (主键)
- level: 日志级别 (debug/info/warn/error/fatal)
- message: 消息
- context: JSONB 上下文
- stack_trace: 堆栈跟踪
- created_at: 时间戳
```

#### 8. sessions - 会话表
```sql
- id: UUID (主键)
- user_id: 用户ID (外键)
- token: 会话令牌 (唯一)
- refresh_token: 刷新令牌
- ip_address: IP地址
- user_agent: 用户代理
- expires_at: 过期时间
- created_at, last_activity_at: 时间戳
```

#### 9. backups - 备份记录表
```sql
- id: UUID (主键)
- user_id: 用户ID (外键)
- backup_type: 备份类型 (manual/auto/scheduled)
- file_path: 文件路径
- file_size: 文件大小
- items_count: 条目数量
- status: 状态 (pending/in-progress/completed/failed)
- error_message: 错误消息
- created_at: 时间戳
```

### 视图

#### active_users_stats - 活跃用户统计
显示最近30天的每日活跃用户数和操作数

#### user_overview - 用户概览
显示每个用户的基本信息和条目统计

## 数据库操作

### 连接数据库

```bash
# 使用 psql
docker exec -it cogniflow-postgres psql -U cogniflow_user -d cogniflow

# 或直接在本地连接
psql -h localhost -p 5432 -U cogniflow_user -d cogniflow
```

### 常用命令

```sql
-- 列出所有表
\dt

-- 查看表结构
\d users
\d items

-- 查看视图
\dv

-- 查询用户数量
SELECT COUNT(*) FROM users;

-- 查询条目统计
SELECT type, COUNT(*) as count 
FROM items 
WHERE deleted_at IS NULL 
GROUP BY type;

-- 查看活跃用户
SELECT * FROM active_users_stats;

-- 查看用户概览
SELECT * FROM user_overview;
```

### 备份和恢复

#### 备份数据库

```bash
# 备份整个数据库
docker exec cogniflow-postgres pg_dump -U cogniflow_user -d cogniflow > database/backups/cogniflow_$(date +%Y%m%d_%H%M%S).sql

# 备份特定表
docker exec cogniflow-postgres pg_dump -U cogniflow_user -d cogniflow -t items > database/backups/items_$(date +%Y%m%d_%H%M%S).sql
```

#### 恢复数据库

```bash
# 恢复整个数据库
docker exec -i cogniflow-postgres psql -U cogniflow_user -d cogniflow < database/backups/cogniflow_20250101_120000.sql

# 恢复特定表
docker exec -i cogniflow-postgres psql -U cogniflow_user -d cogniflow < database/backups/items_20250101_120000.sql
```

## Docker 命令

### 基本操作

```bash
# 启动服务
docker-compose up -d

# 停止服务
docker-compose down

# 重启服务
docker-compose restart

# 查看日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f postgres
docker-compose logs -f pgadmin
```

### 数据管理

```bash
# 清理所有数据（⚠️ 危险操作）
docker-compose down -v

# 重新初始化数据库
docker-compose down -v
docker-compose up -d
```

### 性能监控

```bash
# 进入 PostgreSQL 容器
docker exec -it cogniflow-postgres bash

# 查看数据库大小
docker exec cogniflow-postgres psql -U cogniflow_user -d cogniflow -c "SELECT pg_size_pretty(pg_database_size('cogniflow'));"

# 查看表大小
docker exec cogniflow-postgres psql -U cogniflow_user -d cogniflow -c "SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) FROM pg_tables WHERE schemaname = 'public' ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;"
```

## 性能优化

### 索引策略

数据库已创建以下索引以优化查询性能：

1. **用户相关**: username, email, phone
2. **条目查询**: user_id, type, status, priority
3. **时间范围**: due_date, start_time, end_time, created_at
4. **标签搜索**: GIN 索引 on tags 数组
5. **全文搜索**: GIN 索引 on title + description + raw_text

### 查询优化建议

```sql
-- 使用索引查询
SELECT * FROM items WHERE user_id = 'xxx' AND type = 'task';

-- 避免全表扫描
SELECT * FROM items WHERE deleted_at IS NULL;

-- 使用分页
SELECT * FROM items 
WHERE user_id = 'xxx' 
ORDER BY created_at DESC 
LIMIT 20 OFFSET 0;

-- 使用全文搜索
SELECT * FROM items 
WHERE to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(description, '')) 
@@ to_tsquery('simple', '搜索词');
```

## 安全建议

1. **生产环境**：
   - 修改默认密码
   - 使用强密码
   - 限制数据库访问IP
   - 启用 SSL 连接

2. **备份策略**：
   - 设置定时自动备份
   - 保留多个备份版本
   - 定期测试恢复流程

3. **监控**：
   - 监控连接数
   - 监控查询性能
   - 设置告警规则

## 故障排查

### 连接失败

```bash
# 检查容器状态
docker-compose ps

# 查看日志
docker-compose logs postgres

# 重启服务
docker-compose restart postgres
```

### 性能问题

```sql
-- 查看慢查询
SELECT * FROM pg_stat_statements 
WHERE mean_exec_time > 1000 
ORDER BY mean_exec_time DESC;

-- 查看表统计信息
SELECT * FROM pg_stat_user_tables;

-- 更新统计信息
ANALYZE;
```

### 磁盘空间

```bash
# 查看 Docker 卷使用情况
docker system df -v

# 清理未使用的资源
docker system prune
```

## 下一步

1. 安装依赖: `./scripts/install-db-deps.sh`
2. 启动数据库: `docker-compose up -d`
3. 运行 API 服务器 (待实现)
4. 运行数据迁移工具 (待实现)
5. 测试和验证

## 相关文件

- `docker-compose.yml` - Docker 配置
- `database/init/01_schema.sql` - 数据库表结构
- `database/init/02_test_data.sql` - 测试数据
- `server/db/pool.ts` - 数据库连接池
- `.env.example` - 环境变量示例

## 技术支持

如遇问题，请查看：
1. Docker 日志: `docker-compose logs`
2. 数据库日志: `docker exec cogniflow-postgres cat /var/log/postgresql/postgresql-*.log`
3. pgAdmin Web 界面: http://localhost:5050
