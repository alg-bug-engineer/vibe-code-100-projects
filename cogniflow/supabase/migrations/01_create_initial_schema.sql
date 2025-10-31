/*
# 创建CogniFlow初始数据库结构 v2

## 1. 新建表

### profiles表
用户信息表,存储用户基本信息和角色
- `id` (uuid, 主键) - 用户ID,关联auth.users
- `phone` (text, 唯一) - 手机号
- `email` (text, 唯一) - 邮箱
- `role` (user_role枚举) - 用户角色(user/admin)
- `created_at` (timestamptz) - 创建时间

### items表
信息条目表,存储用户输入的所有信息及AI处理结果
- `id` (uuid, 主键) - 条目ID
- `user_id` (uuid, 外键) - 所属用户ID
- `raw_text` (text, 非空) - 用户原始输入文本
- `type` (item_type枚举) - 条目类型(task/event/note/data)
- `title` (text) - AI提取的标题
- `description` (text) - AI提取的描述
- `due_date` (timestamptz) - 截止日期/事件时间
- `priority` (text) - 优先级(high/medium/low)
- `status` (text) - 状态(pending/completed/archived)
- `tags` (text[]) - 标签数组
- `entities` (jsonb) - AI提取的实体信息
- `created_at` (timestamptz) - 创建时间
- `updated_at` (timestamptz) - 更新时间
- `archived_at` (timestamptz) - 归档时间

## 2. 安全策略

### profiles表
- 启用RLS
- 管理员拥有完全访问权限
- 用户只能查看和更新自己的信息

### items表
- 启用RLS
- 管理员拥有完全访问权限
- 用户拥有自己条目的完全权限(增删改查)
*/

-- 创建枚举类型(如果不存在)
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('user', 'admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE item_type AS ENUM ('task', 'event', 'note', 'data');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 创建profiles表
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone text UNIQUE,
  email text UNIQUE,
  role user_role DEFAULT 'user'::user_role NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 创建items表
CREATE TABLE IF NOT EXISTS items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  raw_text text NOT NULL,
  type item_type NOT NULL,
  title text,
  description text,
  due_date timestamptz,
  priority text DEFAULT 'medium',
  status text DEFAULT 'pending',
  tags text[] DEFAULT '{}',
  entities jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  archived_at timestamptz
);

-- 创建索引以提升查询性能
CREATE INDEX IF NOT EXISTS idx_items_user_id ON items(user_id);
CREATE INDEX IF NOT EXISTS idx_items_type ON items(type);
CREATE INDEX IF NOT EXISTS idx_items_status ON items(status);
CREATE INDEX IF NOT EXISTS idx_items_due_date ON items(due_date);
CREATE INDEX IF NOT EXISTS idx_items_created_at ON items(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_items_tags ON items USING GIN(tags);

-- 启用RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- 创建管理员检查函数
CREATE OR REPLACE FUNCTION is_admin(uid uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = uid AND p.role = 'admin'::user_role
  );
$$;

-- 删除旧策略(如果存在)
DROP POLICY IF EXISTS "管理员拥有完全访问权限" ON profiles;
DROP POLICY IF EXISTS "用户可以查看自己的信息" ON profiles;
DROP POLICY IF EXISTS "用户可以更新自己的信息" ON profiles;

-- profiles表的RLS策略
CREATE POLICY "管理员拥有完全访问权限" ON profiles
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "用户可以查看自己的信息" ON profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "用户可以更新自己的信息" ON profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

-- 删除旧策略(如果存在)
DROP POLICY IF EXISTS "管理员拥有完全访问权限" ON items;
DROP POLICY IF EXISTS "用户可以查看自己的条目" ON items;
DROP POLICY IF EXISTS "用户可以创建自己的条目" ON items;
DROP POLICY IF EXISTS "用户可以更新自己的条目" ON items;
DROP POLICY IF EXISTS "用户可以删除自己的条目" ON items;

-- items表的RLS策略
CREATE POLICY "管理员拥有完全访问权限" ON items
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "用户可以查看自己的条目" ON items
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "用户可以创建自己的条目" ON items
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户可以更新自己的条目" ON items
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "用户可以删除自己的条目" ON items
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 创建新用户处理触发器
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  user_count int;
BEGIN
  IF OLD.confirmed_at IS NULL AND NEW.confirmed_at IS NOT NULL THEN
    SELECT COUNT(*) INTO user_count FROM profiles;
    INSERT INTO profiles (id, phone, email, role)
    VALUES (
      NEW.id,
      NEW.phone,
      NEW.email,
      CASE WHEN user_count = 0 THEN 'admin'::user_role ELSE 'user'::user_role END
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- 创建自动更新updated_at的触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_items_updated_at ON items;
CREATE TRIGGER update_items_updated_at
  BEFORE UPDATE ON items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
