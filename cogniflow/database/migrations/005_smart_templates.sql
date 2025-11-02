-- ============================================
-- 智能模板功能数据库迁移
-- ============================================

-- 1. 扩展 items 表，添加集合类型支持
-- 修改 type 字段的约束，添加 'collection' 类型
ALTER TABLE items DROP CONSTRAINT IF EXISTS items_type_check;
ALTER TABLE items ADD CONSTRAINT items_type_check 
    CHECK (type IN ('task', 'event', 'note', 'data', 'url', 'collection'));

-- 添加集合类型字段
ALTER TABLE items ADD COLUMN IF NOT EXISTS collection_type VARCHAR(50);

-- 添加子任务字段 (JSONB格式存储)
ALTER TABLE items ADD COLUMN IF NOT EXISTS sub_items JSONB DEFAULT '[]';

-- 为集合类型添加索引
CREATE INDEX IF NOT EXISTS idx_items_collection_type ON items(collection_type) WHERE collection_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_items_sub_items ON items USING GIN(sub_items);

-- ============================================
-- 2. 创建用户模板表
-- ============================================
CREATE TABLE IF NOT EXISTS user_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- 模板基本信息
    trigger_word VARCHAR(50) NOT NULL,      -- 触发词，例如 "日报"
    template_name VARCHAR(100) NOT NULL,    -- 模板名称，例如 "每日工作日志"
    icon VARCHAR(10) DEFAULT '📝',          -- 模板图标
    
    -- 模板配置
    collection_type VARCHAR(50) NOT NULL,   -- 集合类型，对应 items.collection_type
    default_tags TEXT[] DEFAULT '{}',       -- 默认标签
    default_sub_items JSONB DEFAULT '[]',   -- 默认子任务模板
    
    -- 显示设置
    color VARCHAR(20),                      -- 颜色主题
    is_active BOOLEAN DEFAULT true,         -- 是否启用
    sort_order INTEGER DEFAULT 0,           -- 排序顺序
    
    -- 统计信息
    usage_count INTEGER DEFAULT 0,          -- 使用次数
    
    -- 时间戳
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- 唯一约束：同一用户的触发词不能重复
    UNIQUE(user_id, trigger_word)
);

-- 用户模板表索引
CREATE INDEX idx_user_templates_user_id ON user_templates(user_id);
CREATE INDEX idx_user_templates_trigger_word ON user_templates(trigger_word);
CREATE INDEX idx_user_templates_is_active ON user_templates(is_active);
CREATE INDEX idx_user_templates_usage_count ON user_templates(usage_count DESC);

-- ============================================
-- 3. 插入默认模板
-- ============================================
-- 为系统管理员用户创建默认模板（实际使用时需要替换为真实用户ID）
-- 这里提供模板示例，实际插入应该在用户注册时进行

-- 示例模板数据（需要在应用层为每个新用户创建）
COMMENT ON TABLE user_templates IS '用户自定义智能模板表，存储用户创建的各种模板配置';
COMMENT ON COLUMN user_templates.trigger_word IS '触发词，用户输入 /触发词 来激活模板';
COMMENT ON COLUMN user_templates.collection_type IS '集合类型标识，用于分类和查询';
COMMENT ON COLUMN user_templates.default_sub_items IS '默认子任务列表，JSON格式: [{"text": "任务1", "status": "pending"}]';

-- ============================================
-- 4. 创建更新触发器
-- ============================================

-- 更新 user_templates 的 updated_at
CREATE OR REPLACE FUNCTION update_user_templates_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_templates_timestamp
    BEFORE UPDATE ON user_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_user_templates_timestamp();

-- ============================================
-- 5. 添加注释说明
-- ============================================
COMMENT ON COLUMN items.collection_type IS '集合类型，当 type=collection 时使用，例如：日报、会议、月报';
COMMENT ON COLUMN items.sub_items IS '子任务列表，JSON格式: [{"id": "uuid", "text": "任务内容", "status": "pending|done"}]';
