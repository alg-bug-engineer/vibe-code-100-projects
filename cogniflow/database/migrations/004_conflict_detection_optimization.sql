-- 时间冲突检测优化
-- 为冲突检测查询添加复合索引

-- 为事项类型和时间范围查询添加复合索引
-- 这将大大提高冲突检测查询的性能
CREATE INDEX IF NOT EXISTS idx_items_conflict_detection 
ON items(user_id, type, deleted_at, start_time, end_time)
WHERE type = 'event' AND deleted_at IS NULL AND start_time IS NOT NULL AND end_time IS NOT NULL;

-- 为 has_conflict 字段添加索引，方便筛选有冲突的事项
CREATE INDEX IF NOT EXISTS idx_items_has_conflict 
ON items(user_id, has_conflict)
WHERE has_conflict = true AND deleted_at IS NULL;

-- 添加注释说明
COMMENT ON INDEX idx_items_conflict_detection IS '优化时间冲突检测查询性能';
COMMENT ON INDEX idx_items_has_conflict IS '快速查询有冲突的事项';
