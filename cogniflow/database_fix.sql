-- ==========================================
-- CogniFlow 数据库快速修复脚本
-- 用途: 添加缺失的字段到 items 表
-- 执行方式: 在 Supabase SQL Editor 中运行
-- ==========================================

-- 步骤 1: 添加 'url' 到 item_type 枚举
-- 注意: 如果枚举值已存在，此操作会被忽略
DO $$ 
BEGIN
    ALTER TYPE item_type ADD VALUE IF NOT EXISTS 'url';
    RAISE NOTICE 'Added url to item_type enum';
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'url already exists in item_type enum';
END $$;

-- 步骤 2: 添加 URL 相关字段
ALTER TABLE items ADD COLUMN IF NOT EXISTS url text;
ALTER TABLE items ADD COLUMN IF NOT EXISTS url_title text;
ALTER TABLE items ADD COLUMN IF NOT EXISTS url_summary text;
ALTER TABLE items ADD COLUMN IF NOT EXISTS url_thumbnail text;
ALTER TABLE items ADD COLUMN IF NOT EXISTS url_fetched_at timestamptz;

-- 步骤 3: 添加高级功能字段
ALTER TABLE items ADD COLUMN IF NOT EXISTS has_conflict boolean DEFAULT false;
ALTER TABLE items ADD COLUMN IF NOT EXISTS start_time timestamptz;
ALTER TABLE items ADD COLUMN IF NOT EXISTS end_time timestamptz;
ALTER TABLE items ADD COLUMN IF NOT EXISTS recurrence_rule text;
ALTER TABLE items ADD COLUMN IF NOT EXISTS recurrence_end_date timestamptz;
ALTER TABLE items ADD COLUMN IF NOT EXISTS master_item_id uuid REFERENCES items(id) ON DELETE CASCADE;
ALTER TABLE items ADD COLUMN IF NOT EXISTS is_master boolean DEFAULT false;

-- 步骤 4: 创建索引（提升查询性能）
CREATE INDEX IF NOT EXISTS idx_items_url ON items(url) WHERE url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_items_url_fetched_at ON items(url_fetched_at DESC) WHERE url_fetched_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_items_has_conflict ON items(has_conflict) WHERE has_conflict = true;
CREATE INDEX IF NOT EXISTS idx_items_start_time ON items(start_time) WHERE start_time IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_items_end_time ON items(end_time) WHERE end_time IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_items_recurrence_rule ON items(recurrence_rule) WHERE recurrence_rule IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_items_master_item_id ON items(master_item_id) WHERE master_item_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_items_is_master ON items(is_master) WHERE is_master = true;

-- 步骤 5: 添加字段注释
COMMENT ON COLUMN items.url IS 'URL地址(当type=url时使用)';
COMMENT ON COLUMN items.url_title IS '网站标题';
COMMENT ON COLUMN items.url_summary IS 'AI生成的网站内容梗概';
COMMENT ON COLUMN items.url_thumbnail IS '网站缩略图URL';
COMMENT ON COLUMN items.url_fetched_at IS '网页内容抓取时间';
COMMENT ON COLUMN items.has_conflict IS '是否存在时间冲突（用于日程管理）';
COMMENT ON COLUMN items.start_time IS '日程开始时间（Event类型使用）';
COMMENT ON COLUMN items.end_time IS '日程结束时间（Event类型使用）';
COMMENT ON COLUMN items.recurrence_rule IS '重复规则（iCalendar RRULE格式）';
COMMENT ON COLUMN items.recurrence_end_date IS '重复结束日期';
COMMENT ON COLUMN items.master_item_id IS '母版条目ID（用于重复任务的实例）';
COMMENT ON COLUMN items.is_master IS '是否为母版条目';

-- 步骤 6: 创建冲突检测函数（如果不存在）
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
  ELSE
    -- 非Event类型或无时间信息，不检测冲突
    NEW.has_conflict := false;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 步骤 7: 创建触发器（如果不存在）
DROP TRIGGER IF EXISTS trigger_check_event_conflicts ON items;
CREATE TRIGGER trigger_check_event_conflicts
  BEFORE INSERT OR UPDATE ON items
  FOR EACH ROW
  EXECUTE FUNCTION check_event_conflicts();

-- ==========================================
-- 验证脚本
-- 运行以下查询验证字段是否已添加
-- ==========================================

-- 查看所有字段
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'items'
ORDER BY ordinal_position;

-- 查看枚举值
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = 'item_type'::regtype
ORDER BY enumsortorder;

-- 输出成功信息
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Database migration completed successfully!';
    RAISE NOTICE 'All required fields have been added to the items table.';
    RAISE NOTICE '========================================';
END $$;
