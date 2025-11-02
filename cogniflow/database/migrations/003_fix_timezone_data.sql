-- 修复时区问题：将 TIMESTAMP WITH TIME ZONE 改为 TIMESTAMP (不带时区)
-- 并修正已存储的时间数据

-- 1. 先删除依赖的视图
DROP VIEW IF EXISTS user_overview CASCADE;

-- 2. 修改 items 表的时间字段 - 直接转换类型，保留原始时间值
-- 注意：现有数据如果是 UTC 存储的，会保留 UTC 的时间值
ALTER TABLE items 
  ALTER COLUMN due_date TYPE TIMESTAMP,
  ALTER COLUMN start_time TYPE TIMESTAMP,
  ALTER COLUMN end_time TYPE TIMESTAMP,
  ALTER COLUMN recurrence_end_date TYPE TIMESTAMP,
  ALTER COLUMN url_fetched_at TYPE TIMESTAMP,
  ALTER COLUMN archived_at TYPE TIMESTAMP,
  ALTER COLUMN deleted_at TYPE TIMESTAMP;

-- 3. 修正数据：将 UTC 时间加上 8 小时，转换为中国本地时间
UPDATE items 
SET 
  due_date = due_date + INTERVAL '8 hours' 
WHERE due_date IS NOT NULL;

UPDATE items 
SET 
  start_time = start_time + INTERVAL '8 hours',
  end_time = end_time + INTERVAL '8 hours'
WHERE start_time IS NOT NULL;

UPDATE items 
SET 
  recurrence_end_date = recurrence_end_date + INTERVAL '8 hours'
WHERE recurrence_end_date IS NOT NULL;

-- 4. 重新创建视图
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

-- 5. 添加注释
COMMENT ON COLUMN items.due_date IS '截止日期时间（本地时间，不含时区）';
COMMENT ON COLUMN items.start_time IS '开始时间（本地时间，不含时区）';
COMMENT ON COLUMN items.end_time IS '结束时间（本地时间，不含时区）';
COMMENT ON COLUMN items.recurrence_end_date IS '重复结束日期（本地时间，不含时区）';
