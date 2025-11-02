-- ============================================
-- CogniFlow 数据库初始化脚本
-- PostgreSQL 16+
-- ============================================

-- 创建数据库扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- 1. 用户表 (users)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    avatar_url TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP WITH TIME ZONE
);

-- 用户表索引
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_created_at ON users(created_at);

-- ============================================
-- 2. 用户配置表 (user_settings)
-- ============================================
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    theme VARCHAR(20) DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
    language VARCHAR(10) DEFAULT 'zh-CN',
    notifications_enabled BOOLEAN DEFAULT true,
    email_notifications BOOLEAN DEFAULT true,
    timezone VARCHAR(50) DEFAULT 'Asia/Shanghai',
    settings_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- 用户配置表索引
CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);

-- ============================================
-- 3. 条目表 (items)
-- ============================================
CREATE TABLE IF NOT EXISTS items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    raw_text TEXT NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('task', 'event', 'note', 'data', 'url')),
    title VARCHAR(500),
    description TEXT,
    due_date TIMESTAMP WITH TIME ZONE,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'blocked', 'completed')),
    
    -- 日程相关字段
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    has_conflict BOOLEAN DEFAULT false,
    recurrence_rule TEXT,
    recurrence_end_date TIMESTAMP WITH TIME ZONE,
    master_item_id UUID REFERENCES items(id) ON DELETE SET NULL,
    is_master BOOLEAN DEFAULT false,
    
    -- URL 相关字段
    url TEXT,
    url_title VARCHAR(500),
    url_summary TEXT,
    url_thumbnail TEXT,
    url_fetched_at TIMESTAMP WITH TIME ZONE,
    
    -- 元数据
    tags TEXT[] DEFAULT '{}',
    entities JSONB DEFAULT '{}',
    
    -- 状态标识
    archived_at TIMESTAMP WITH TIME ZONE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    -- 时间戳
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 条目表索引
CREATE INDEX idx_items_user_id ON items(user_id);
CREATE INDEX idx_items_type ON items(type);
CREATE INDEX idx_items_status ON items(status);
CREATE INDEX idx_items_priority ON items(priority);
CREATE INDEX idx_items_due_date ON items(due_date);
CREATE INDEX idx_items_start_time ON items(start_time);
CREATE INDEX idx_items_end_time ON items(end_time);
CREATE INDEX idx_items_archived_at ON items(archived_at);
CREATE INDEX idx_items_deleted_at ON items(deleted_at);
CREATE INDEX idx_items_created_at ON items(created_at DESC);
CREATE INDEX idx_items_tags ON items USING GIN(tags);
CREATE INDEX idx_items_entities ON items USING GIN(entities);
CREATE INDEX idx_items_user_type ON items(user_id, type);
CREATE INDEX idx_items_user_status ON items(user_id, status);

-- 全文搜索索引
CREATE INDEX idx_items_text_search ON items USING GIN(
    to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(raw_text, ''))
);

-- ============================================
-- 4. 标签表 (tags)
-- ============================================
CREATE TABLE IF NOT EXISTS tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(20),
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, name)
);

-- 标签表索引
CREATE INDEX idx_tags_user_id ON tags(user_id);
CREATE INDEX idx_tags_name ON tags(name);
CREATE INDEX idx_tags_usage_count ON tags(usage_count DESC);

-- ============================================
-- 5. 用户活动日志表 (activity_logs)
-- ============================================
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 活动日志表索引
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_action ON activity_logs(action);
CREATE INDEX idx_activity_logs_entity_type ON activity_logs(entity_type);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- ============================================
-- 6. 用户统计表 (user_statistics)
-- ============================================
CREATE TABLE IF NOT EXISTS user_statistics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    
    -- 条目统计
    total_items INTEGER DEFAULT 0,
    tasks_created INTEGER DEFAULT 0,
    tasks_completed INTEGER DEFAULT 0,
    events_created INTEGER DEFAULT 0,
    notes_created INTEGER DEFAULT 0,
    urls_saved INTEGER DEFAULT 0,
    
    -- 活动统计
    login_count INTEGER DEFAULT 0,
    active_minutes INTEGER DEFAULT 0,
    
    -- JSON 格式的详细统计
    detailed_stats JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, date)
);

-- 统计表索引
CREATE INDEX idx_user_statistics_user_id ON user_statistics(user_id);
CREATE INDEX idx_user_statistics_date ON user_statistics(date DESC);

-- ============================================
-- 7. 系统日志表 (system_logs)
-- ============================================
CREATE TABLE IF NOT EXISTS system_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    level VARCHAR(20) NOT NULL CHECK (level IN ('debug', 'info', 'warn', 'error', 'fatal')),
    message TEXT NOT NULL,
    context JSONB DEFAULT '{}',
    stack_trace TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 系统日志表索引
CREATE INDEX idx_system_logs_level ON system_logs(level);
CREATE INDEX idx_system_logs_created_at ON system_logs(created_at DESC);

-- ============================================
-- 8. 会话表 (sessions)
-- ============================================
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) UNIQUE NOT NULL,
    refresh_token VARCHAR(500),
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 会话表索引
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);

-- ============================================
-- 9. 备份记录表 (backups)
-- ============================================
CREATE TABLE IF NOT EXISTS backups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    backup_type VARCHAR(20) NOT NULL CHECK (backup_type IN ('manual', 'auto', 'scheduled')),
    file_path TEXT NOT NULL,
    file_size BIGINT,
    items_count INTEGER,
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'in-progress', 'completed', 'failed')),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 备份记录表索引
CREATE INDEX idx_backups_user_id ON backups(user_id);
CREATE INDEX idx_backups_created_at ON backups(created_at DESC);
CREATE INDEX idx_backups_status ON backups(status);

-- ============================================
-- 自动更新 updated_at 触发器
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为所有需要的表添加触发器
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_items_updated_at BEFORE UPDATE ON items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tags_updated_at BEFORE UPDATE ON tags
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_statistics_updated_at BEFORE UPDATE ON user_statistics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 插入默认管理员用户
-- 密码: admin123 (使用 pgcrypto 的 crypt 函数加密)
-- ============================================
INSERT INTO users (username, email, password_hash, role)
VALUES (
    'admin',
    'admin@cogniflow.local',
    crypt('admin123', gen_salt('bf', 10)),
    'admin'
) ON CONFLICT (username) DO NOTHING;

-- 为管理员用户创建默认设置
INSERT INTO user_settings (user_id, theme, language, notifications_enabled)
SELECT id, 'system', 'zh-CN', true
FROM users
WHERE username = 'admin'
ON CONFLICT (user_id) DO NOTHING;

-- ============================================
-- 视图：活跃用户统计
-- ============================================
CREATE OR REPLACE VIEW active_users_stats AS
SELECT 
    DATE(created_at) as date,
    COUNT(DISTINCT user_id) as active_users,
    COUNT(*) as total_actions
FROM activity_logs
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- ============================================
-- 视图：用户概览
-- ============================================
CREATE OR REPLACE VIEW user_overview AS
SELECT 
    u.id,
    u.username,
    u.email,
    u.role,
    u.status,
    u.created_at,
    u.last_login_at,
    COUNT(DISTINCT i.id) FILTER (WHERE i.deleted_at IS NULL) as total_items,
    COUNT(DISTINCT i.id) FILTER (WHERE i.type = 'task' AND i.deleted_at IS NULL) as tasks_count,
    COUNT(DISTINCT i.id) FILTER (WHERE i.type = 'event' AND i.deleted_at IS NULL) as events_count,
    COUNT(DISTINCT i.id) FILTER (WHERE i.status = 'completed') as completed_count
FROM users u
LEFT JOIN items i ON u.id = i.user_id
GROUP BY u.id, u.username, u.email, u.role, u.status, u.created_at, u.last_login_at;

-- ============================================
-- 完成信息
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'CogniFlow 数据库初始化完成！';
    RAISE NOTICE '========================================';
    RAISE NOTICE '默认管理员账号:';
    RAISE NOTICE '  用户名: admin';
    RAISE NOTICE '  密码: admin123';
    RAISE NOTICE '========================================';
END $$;
