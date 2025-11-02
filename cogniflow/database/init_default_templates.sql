-- ============================================
-- 为现有用户初始化默认模板
-- ============================================

DO $$
DECLARE
    user_record RECORD;
BEGIN
    -- 为每个用户创建默认模板
    FOR user_record IN SELECT id FROM users LOOP
        -- 检查用户是否已有模板
        IF NOT EXISTS (SELECT 1 FROM user_templates WHERE user_id = user_record.id) THEN
            -- 创建日报模板
            INSERT INTO user_templates (
                user_id, trigger_word, template_name, icon, collection_type,
                default_tags, default_sub_items, is_active, sort_order
            ) VALUES (
                user_record.id,
                '日报',
                '每日工作日志',
                '📰',
                '日报',
                ARRAY['工作', '日报'],
                '[
                    {"id": "1", "text": "总结今日完成的工作", "status": "pending"},
                    {"id": "2", "text": "记录遇到的问题", "status": "pending"},
                    {"id": "3", "text": "规划明日工作计划", "status": "pending"}
                ]'::jsonb,
                true,
                0
            );

            -- 创建会议模板
            INSERT INTO user_templates (
                user_id, trigger_word, template_name, icon, collection_type,
                default_tags, default_sub_items, is_active, sort_order
            ) VALUES (
                user_record.id,
                '会议',
                '会议纪要',
                '👥',
                '会议',
                ARRAY['会议', '工作'],
                '[
                    {"id": "1", "text": "记录会议议题", "status": "pending"},
                    {"id": "2", "text": "记录讨论要点", "status": "pending"},
                    {"id": "3", "text": "记录行动项", "status": "pending"}
                ]'::jsonb,
                true,
                1
            );

            -- 创建月报模板
            INSERT INTO user_templates (
                user_id, trigger_word, template_name, icon, collection_type,
                default_tags, default_sub_items, is_active, sort_order
            ) VALUES (
                user_record.id,
                '月报',
                '月度总结',
                '📅',
                '月报',
                ARRAY['工作', '月报'],
                '[
                    {"id": "1", "text": "本月工作完成情况", "status": "pending"},
                    {"id": "2", "text": "重点成果与亮点", "status": "pending"},
                    {"id": "3", "text": "下月工作计划", "status": "pending"}
                ]'::jsonb,
                true,
                2
            );

            RAISE NOTICE '✅ 为用户 % 创建了默认模板', user_record.id;
        ELSE
            RAISE NOTICE '⏭️  用户 % 已有模板，跳过', user_record.id;
        END IF;
    END LOOP;
END $$;

-- 显示结果
SELECT 
    u.username,
    COUNT(t.id) as template_count
FROM users u
LEFT JOIN user_templates t ON u.id = t.user_id
GROUP BY u.username
ORDER BY u.username;
