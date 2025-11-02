-- ============================================
-- 测试数据插入脚本（开发环境）
-- ============================================

-- 创建测试用户
INSERT INTO users (username, email, phone, password_hash, role)
VALUES 
    ('testuser1', 'test1@example.com', '13800138001', crypt('password123', gen_salt('bf', 10)), 'user'),
    ('testuser2', 'test2@example.com', '13800138002', crypt('password123', gen_salt('bf', 10)), 'user')
ON CONFLICT (username) DO NOTHING;

-- 为测试用户创建设置
INSERT INTO user_settings (user_id, theme, language, notifications_enabled)
SELECT id, 'light', 'zh-CN', true
FROM users
WHERE username IN ('testuser1', 'testuser2')
ON CONFLICT (user_id) DO NOTHING;

-- 插入测试条目
DO $$
DECLARE
    test_user_id UUID;
BEGIN
    SELECT id INTO test_user_id FROM users WHERE username = 'testuser1' LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        -- 任务
        INSERT INTO items (user_id, raw_text, type, title, description, due_date, priority, status, tags)
        VALUES 
            (test_user_id, '完成项目文档', 'task', '完成项目文档', '需要在周五前完成所有文档编写工作', NOW() + INTERVAL '2 days', 'high', 'in-progress', ARRAY['工作', '文档']),
            (test_user_id, '购买生活用品', 'task', '购买生活用品', '牙膏、洗发水、纸巾', NOW() + INTERVAL '1 day', 'medium', 'pending', ARRAY['生活', '购物']),
            (test_user_id, '锻炼身体', 'task', '锻炼身体', '每天跑步30分钟', NOW(), 'low', 'pending', ARRAY['健康', '运动']);
        
        -- 日程
        INSERT INTO items (user_id, raw_text, type, title, description, start_time, end_time, priority, status, tags)
        VALUES 
            (test_user_id, '团队会议', 'event', '团队会议', '讨论下周工作计划', NOW() + INTERVAL '1 day' + INTERVAL '10 hours', NOW() + INTERVAL '1 day' + INTERVAL '11 hours', 'high', 'pending', ARRAY['工作', '会议']),
            (test_user_id, '午餐约会', 'event', '午餐约会', '和朋友一起吃饭', NOW() + INTERVAL '2 days' + INTERVAL '12 hours', NOW() + INTERVAL '2 days' + INTERVAL '13 hours', 'medium', 'pending', ARRAY['社交', '餐饮']);
        
        -- 笔记
        INSERT INTO items (user_id, raw_text, type, title, description, tags)
        VALUES 
            (test_user_id, '学习笔记', 'note', 'React Hooks 学习笔记', 'useState 和 useEffect 的使用要点...', ARRAY['学习', '技术']),
            (test_user_id, '想法记录', 'note', '产品改进想法', '可以添加更多的数据可视化功能...', ARRAY['产品', '想法']);
        
        -- URL
        INSERT INTO items (user_id, raw_text, type, title, url, url_title, url_summary, tags)
        VALUES 
            (test_user_id, 'https://react.dev', 'url', 'React 官方文档', 'https://react.dev', 'React - The library for web and native user interfaces', 'React 是一个用于构建用户界面的 JavaScript 库', ARRAY['技术', '文档', 'React']);
    END IF;
END $$;

-- 插入测试标签
DO $$
DECLARE
    test_user_id UUID;
BEGIN
    SELECT id INTO test_user_id FROM users WHERE username = 'testuser1' LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        INSERT INTO tags (user_id, name, color, usage_count)
        VALUES 
            (test_user_id, '工作', '#3B82F6', 10),
            (test_user_id, '学习', '#10B981', 8),
            (test_user_id, '生活', '#F59E0B', 5),
            (test_user_id, '健康', '#EF4444', 3)
        ON CONFLICT (user_id, name) DO NOTHING;
    END IF;
END $$;

-- 插入测试活动日志
DO $$
DECLARE
    test_user_id UUID;
BEGIN
    SELECT id INTO test_user_id FROM users WHERE username = 'testuser1' LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        INSERT INTO activity_logs (user_id, action, entity_type, details)
        VALUES 
            (test_user_id, 'login', NULL, '{"device": "desktop", "browser": "Chrome"}'),
            (test_user_id, 'create_item', 'task', '{"title": "完成项目文档"}'),
            (test_user_id, 'update_item', 'task', '{"status": "in-progress"}'),
            (test_user_id, 'create_item', 'event', '{"title": "团队会议"}');
    END IF;
END $$;

-- 完成信息
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '测试数据插入完成！';
    RAISE NOTICE '========================================';
    RAISE NOTICE '测试账号:';
    RAISE NOTICE '  用户名: testuser1';
    RAISE NOTICE '  密码: password123';
    RAISE NOTICE '========================================';
END $$;
