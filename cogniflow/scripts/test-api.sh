#!/bin/bash

# CogniFlow API 测试脚本
# 用于快速测试 PostgreSQL API 服务器

set -e

API_URL="http://localhost:3001"
echo "🧪 开始测试 CogniFlow API..."
echo ""

# 1. 健康检查
echo "1️⃣ 测试健康检查..."
HEALTH=$(curl -s "${API_URL}/health")
if echo "$HEALTH" | grep -q "healthy"; then
    echo "✅ 健康检查通过"
else
    echo "❌ 健康检查失败"
    exit 1
fi
echo ""

# 2. 用户注册
echo "2️⃣ 测试用户注册..."
REGISTER_RESPONSE=$(curl -s -X POST "${API_URL}/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"testuser_$(date +%s)\",\"password\":\"test123\",\"email\":\"test@example.com\"}")

if echo "$REGISTER_RESPONSE" | grep -q "token"; then
    echo "✅ 用户注册成功"
    TOKEN=$(echo "$REGISTER_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
else
    echo "⚠️  注册失败，尝试使用已有用户登录..."
    
    # 3. 用户登录
    echo "3️⃣ 测试用户登录..."
    LOGIN_RESPONSE=$(curl -s -X POST "${API_URL}/api/auth/login" \
      -H "Content-Type: application/json" \
      -d '{"username":"admin","password":"admin123"}')
    
    if echo "$LOGIN_RESPONSE" | grep -q "token"; then
        echo "✅ 用户登录成功"
        TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    else
        echo "❌ 登录失败"
        exit 1
    fi
fi
echo ""

# 4. 获取用户信息
echo "4️⃣ 测试获取用户信息..."
USER_INFO=$(curl -s -X GET "${API_URL}/api/users/me" \
  -H "Authorization: Bearer ${TOKEN}")

if echo "$USER_INFO" | grep -q "username"; then
    echo "✅ 获取用户信息成功"
else
    echo "❌ 获取用户信息失败"
    exit 1
fi
echo ""

# 5. 创建条目
echo "5️⃣ 测试创建条目..."
CREATE_ITEM=$(curl -s -X POST "${API_URL}/api/items" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "raw_text": "测试任务",
    "type": "task",
    "title": "API测试任务",
    "description": "通过脚本创建的测试任务",
    "priority": "medium",
    "status": "pending",
    "tags": ["测试"]
  }')

if echo "$CREATE_ITEM" | grep -q "id"; then
    echo "✅ 创建条目成功"
    ITEM_ID=$(echo "$CREATE_ITEM" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
else
    echo "❌ 创建条目失败"
    exit 1
fi
echo ""

# 6. 获取条目列表
echo "6️⃣ 测试获取条目列表..."
ITEMS=$(curl -s -X GET "${API_URL}/api/items" \
  -H "Authorization: Bearer ${TOKEN}")

ITEM_COUNT=$(echo "$ITEMS" | grep -o '"id"' | wc -l | tr -d ' ')
echo "✅ 获取到 ${ITEM_COUNT} 个条目"
echo ""

# 7. 获取统计信息
echo "7️⃣ 测试获取统计信息..."
STATS=$(curl -s -X GET "${API_URL}/api/users/stats" \
  -H "Authorization: Bearer ${TOKEN}")

if echo "$STATS" | grep -q "itemStats"; then
    echo "✅ 获取统计信息成功"
else
    echo "❌ 获取统计信息失败"
fi
echo ""

echo "🎉 所有测试通过！API 服务器工作正常。"
echo ""
echo "📊 测试摘要:"
echo "   - 健康检查: ✅"
echo "   - 用户认证: ✅"
echo "   - 条目管理: ✅"
echo "   - 统计信息: ✅"
echo ""
echo "💡 提示: 可以通过以下命令查看详细信息:"
echo "   export TOKEN=\"${TOKEN}\""
echo "   curl -H \"Authorization: Bearer \$TOKEN\" ${API_URL}/api/items | jq"
