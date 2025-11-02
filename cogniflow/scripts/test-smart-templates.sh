#!/bin/bash

# 智能模板功能测试脚本

echo "🧪 智能模板功能测试"
echo "=================="
echo ""

# 1. 检查数据库表
echo "1️⃣  检查数据库表结构..."
docker exec cogniflow-postgres psql -U cogniflow_user -d cogniflow -c "
SELECT 
    'users' as table_name, 
    (SELECT COUNT(*) FROM users) as count,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'users') as columns
UNION ALL
SELECT 
    'user_templates', 
    (SELECT COUNT(*) FROM user_templates),
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'user_templates')
UNION ALL
SELECT 
    'items', 
    (SELECT COUNT(*) FROM items),
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'items');
"

echo ""
echo "2️⃣  检查用户和模板关系..."
docker exec cogniflow-postgres psql -U cogniflow_user -d cogniflow -c "
SELECT 
    u.username,
    u.id,
    (SELECT COUNT(*) FROM user_templates WHERE user_id = u.id) as template_count
FROM users u
ORDER BY u.created_at DESC;
"

echo ""
echo "3️⃣  检查模板详情..."
docker exec cogniflow-postgres psql -U cogniflow_user -d cogniflow -c "
SELECT 
    trigger_word,
    template_name,
    icon,
    collection_type,
    is_active,
    usage_count
FROM user_templates
ORDER BY user_id, sort_order;
"

echo ""
echo "4️⃣  检查 items 表的 collection 支持..."
docker exec cogniflow-postgres psql -U cogniflow_user -d cogniflow -c "
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'items' 
    AND column_name IN ('type', 'collection_type', 'sub_items')
ORDER BY column_name;
"

echo ""
echo "5️⃣  测试 collection 类型约束..."
docker exec cogniflow-postgres psql -U cogniflow_user -d cogniflow -c "
SELECT 
    constraint_name,
    check_clause
FROM information_schema.check_constraints
WHERE constraint_name LIKE '%type%'
    AND constraint_schema = 'public';
" 2>/dev/null || echo "无法查询约束"

echo ""
echo "✅ 测试完成！"
echo ""
echo "📋 使用说明:"
echo "1. 确保服务器正在运行: npm run dev:postgres"
echo "2. 登录到应用"
echo "3. 在输入框中输入 /"
echo "4. 应该看到3个默认模板: 📰 日报, 👥 会议, 📅 月报"
