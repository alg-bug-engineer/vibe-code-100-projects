/*
# 添加URL链接支持

## 1. 枚举类型更新
- 在item_type枚举中添加'url'类型

## 2. items表字段扩展
- `url` (text) - URL地址
- `url_title` (text) - 网站标题
- `url_summary` (text) - 网站梗概
- `url_thumbnail` (text) - 缩略图URL
- `url_fetched_at` (timestamptz) - 内容抓取时间

## 3. 索引优化
- 为url字段创建索引,提升查询性能

## 4. 说明
- 当type='url'时,这些字段存储网站相关信息
- url_summary由AI生成,提供网站内容梗概
- 其他类型的条目这些字段为null
*/

-- 添加新的枚举值到item_type
ALTER TYPE item_type ADD VALUE IF NOT EXISTS 'url';

-- 为items表添加URL相关字段
ALTER TABLE items ADD COLUMN IF NOT EXISTS url text;
ALTER TABLE items ADD COLUMN IF NOT EXISTS url_title text;
ALTER TABLE items ADD COLUMN IF NOT EXISTS url_summary text;
ALTER TABLE items ADD COLUMN IF NOT EXISTS url_thumbnail text;
ALTER TABLE items ADD COLUMN IF NOT EXISTS url_fetched_at timestamptz;

-- 创建URL字段的索引
CREATE INDEX IF NOT EXISTS idx_items_url ON items(url) WHERE url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_items_url_fetched_at ON items(url_fetched_at DESC) WHERE url_fetched_at IS NOT NULL;

-- 添加注释
COMMENT ON COLUMN items.url IS 'URL地址(当type=url时使用)';
COMMENT ON COLUMN items.url_title IS '网站标题';
COMMENT ON COLUMN items.url_summary IS 'AI生成的网站内容梗概';
COMMENT ON COLUMN items.url_thumbnail IS '网站缩略图URL';
COMMENT ON COLUMN items.url_fetched_at IS '网页内容抓取时间';
