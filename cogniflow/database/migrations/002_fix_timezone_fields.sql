-- 修复时区问题：将 TIMESTAMP WITH TIME ZONE 改为 TIMESTAMP (不带时区)
-- 这样可以直接存储和显示本地时间，不进行时区转换

-- 1. 先删除依赖的视图
DROP VIEW IF EXISTS user_overview CASCADE;

-- 2. 修改 items 表的时间字段
ALTER TABLE items 
  ALTER COLUMN due_date TYPE TIMESTAMP USING due_date AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Shanghai',
  ALTER COLUMN start_time TYPE TIMESTAMP USING start_time AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Shanghai',
  ALTER COLUMN end_time TYPE TIMESTAMP USING end_time AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Shanghai',
  ALTER COLUMN recurrence_end_date TYPE TIMESTAMP USING recurrence_end_date AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Shanghai',
  ALTER COLUMN url_fetched_at TYPE TIMESTAMP USING url_fetched_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Shanghai',
  ALTER COLUMN archived_at TYPE TIMESTAMP USING archived_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Shanghai',
  ALTER COLUMN deleted_at TYPE TIMESTAMP USING deleted_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Shanghai';

-- 3. 重新创建视图
CREATE VIEW user_overview AS
SELECT 
    u.id,
    u.username,
    u.email,
    u.created_at,
    u.last_login_at,
    COUNT(DISTINCT i.id) as total_items,
    COUNT(DISTINCT CASE WHEN i.status = 'completed' THEN i.id END) as completed_items,
    COUNT(DISTINCT CASE WHEN i.archived_at IS NOT NULL THEN i.id END) as archived_items,
    COUNT(DISTINCT t.id) as total_tags
FROM users u
LEFT JOIN items i ON u.id = i.user_id AND i.deleted_at IS NULL
LEFT JOIN tags t ON u.id = t.user_id
GROUP BY u.id, u.username, u.email, u.created_at, u.last_login_at;

-- 4. 添加注释
COMMENT ON COLUMN items.due_date IS '截止日期时间（本地时间，不含时区）';
COMMENT ON COLUMN items.start_time IS '开始时间（本地时间，不含时区）';
COMMENT ON COLUMN items.end_time IS '结束时间（本地时间，不含时区）';
COMMENT ON COLUMN items.recurrence_end_date IS '重复结束日期（本地时间，不含时区）';

