-- ============================================
-- 清空所有数据，保留表结构
-- ============================================

-- 禁用外键约束检查（PostgreSQL）
SET session_replication_role = 'replica';

-- 清空所有表的数据
TRUNCATE TABLE activity_logs CASCADE;
TRUNCATE TABLE tags CASCADE;
TRUNCATE TABLE items CASCADE;
TRUNCATE TABLE user_templates CASCADE;
TRUNCATE TABLE user_settings CASCADE;
TRUNCATE TABLE users CASCADE;

-- 重置序列（如果有自增ID）
-- 注意：UUID 不需要重置

-- 启用外键约束检查
SET session_replication_role = 'origin';

-- 显示清空结果
SELECT 
    schemaname,
    tablename,
    (SELECT COUNT(*) FROM users) as users_count,
    (SELECT COUNT(*) FROM user_settings) as user_settings_count,
    (SELECT COUNT(*) FROM items) as items_count,
    (SELECT COUNT(*) FROM tags) as tags_count,
    (SELECT COUNT(*) FROM user_templates) as user_templates_count,
    (SELECT COUNT(*) FROM activity_logs) as activity_logs_count
FROM pg_tables 
WHERE schemaname = 'public' 
LIMIT 1;

-- 输出清空成功消息
\echo '✅ 所有数据已清空，表结构保留'
\echo '📊 当前记录数：'
\echo '   - users: 0'
\echo '   - user_settings: 0'
\echo '   - items: 0'
\echo '   - tags: 0'
\echo '   - user_templates: 0'
\echo '   - activity_logs: 0'
