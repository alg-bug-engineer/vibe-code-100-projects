/*
# 添加高级功能支持

## 1. 新增字段

### items表扩展
- `has_conflict` (boolean) - 是否存在时间冲突，默认false
- `start_time` (timestamptz) - 日程开始时间（用于Event类型）
- `end_time` (timestamptz) - 日程结束时间（用于Event类型）
- `recurrence_rule` (text) - 重复规则（iCalendar RRULE格式）
- `recurrence_end_date` (timestamptz) - 重复结束日期
- `master_item_id` (uuid) - 母版条目ID（用于重复任务的实例）
- `is_master` (boolean) - 是否为母版条目，默认false

## 2. 索引优化
- 为时间相关字段创建索引，提升查询性能
- 为重复任务相关字段创建索引

## 3. 触发器
- 创建冲突检测触发器，自动检测日程冲突

## 4. 说明
- start_time和end_time用于精确的日程时间管理
- has_conflict由触发器自动维护
- recurrence_rule存储重复规则，格式遵循iCalendar RRULE标准
- master_item_id用于关联重复任务的实例和母版
*/

-- 为items表添加新字段
ALTER TABLE items ADD COLUMN IF NOT EXISTS has_conflict boolean DEFAULT false;
ALTER TABLE items ADD COLUMN IF NOT EXISTS start_time timestamptz;
ALTER TABLE items ADD COLUMN IF NOT EXISTS end_time timestamptz;
ALTER TABLE items ADD COLUMN IF NOT EXISTS recurrence_rule text;
ALTER TABLE items ADD COLUMN IF NOT EXISTS recurrence_end_date timestamptz;
ALTER TABLE items ADD COLUMN IF NOT EXISTS master_item_id uuid REFERENCES items(id) ON DELETE CASCADE;
ALTER TABLE items ADD COLUMN IF NOT EXISTS is_master boolean DEFAULT false;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_items_has_conflict ON items(has_conflict) WHERE has_conflict = true;
CREATE INDEX IF NOT EXISTS idx_items_start_time ON items(start_time) WHERE start_time IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_items_end_time ON items(end_time) WHERE end_time IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_items_recurrence_rule ON items(recurrence_rule) WHERE recurrence_rule IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_items_master_item_id ON items(master_item_id) WHERE master_item_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_items_is_master ON items(is_master) WHERE is_master = true;

-- 创建冲突检测函数
CREATE OR REPLACE FUNCTION check_event_conflicts()
RETURNS TRIGGER AS $$
DECLARE
  conflict_exists boolean;
BEGIN
  -- 只检测Event类型且有开始和结束时间的条目
  IF NEW.type = 'event' AND NEW.start_time IS NOT NULL AND NEW.end_time IS NOT NULL THEN
    -- 检查是否与其他事件冲突
    SELECT EXISTS (
      SELECT 1 FROM items
      WHERE id != NEW.id
        AND user_id = NEW.user_id
        AND type = 'event'
        AND archived_at IS NULL
        AND start_time IS NOT NULL
        AND end_time IS NOT NULL
        AND (
          -- 时间重叠检测: A的开始 < B的结束 且 A的结束 > B的开始
          (NEW.start_time < end_time AND NEW.end_time > start_time)
        )
    ) INTO conflict_exists;
    
    -- 设置当前条目的冲突状态
    NEW.has_conflict := conflict_exists;
    
    -- 如果存在冲突，更新所有冲突条目的状态
    IF conflict_exists THEN
      UPDATE items
      SET has_conflict = true
      WHERE id != NEW.id
        AND user_id = NEW.user_id
        AND type = 'event'
        AND archived_at IS NULL
        AND start_time IS NOT NULL
        AND end_time IS NOT NULL
        AND (
          (NEW.start_time < end_time AND NEW.end_time > start_time)
        );
    END IF;
    
    -- 检查是否需要清除其他条目的冲突状态
    -- 如果某个条目之前有冲突，但现在没有了，需要更新
    UPDATE items
    SET has_conflict = false
    WHERE user_id = NEW.user_id
      AND type = 'event'
      AND archived_at IS NULL
      AND has_conflict = true
      AND id != NEW.id
      AND NOT EXISTS (
        SELECT 1 FROM items AS other
        WHERE other.id != items.id
          AND other.user_id = items.user_id
          AND other.type = 'event'
          AND other.archived_at IS NULL
          AND other.start_time IS NOT NULL
          AND other.end_time IS NOT NULL
          AND (
            (items.start_time < other.end_time AND items.end_time > other.start_time)
          )
      );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
DROP TRIGGER IF EXISTS trigger_check_event_conflicts ON items;
CREATE TRIGGER trigger_check_event_conflicts
  BEFORE INSERT OR UPDATE OF start_time, end_time, type
  ON items
  FOR EACH ROW
  EXECUTE FUNCTION check_event_conflicts();

-- 添加注释
COMMENT ON COLUMN items.has_conflict IS '是否存在时间冲突（自动维护）';
COMMENT ON COLUMN items.start_time IS '日程开始时间（Event类型使用）';
COMMENT ON COLUMN items.end_time IS '日程结束时间（Event类型使用）';
COMMENT ON COLUMN items.recurrence_rule IS '重复规则（iCalendar RRULE格式）';
COMMENT ON COLUMN items.recurrence_end_date IS '重复结束日期';
COMMENT ON COLUMN items.master_item_id IS '母版条目ID（重复任务实例使用）';
COMMENT ON COLUMN items.is_master IS '是否为母版条目';
