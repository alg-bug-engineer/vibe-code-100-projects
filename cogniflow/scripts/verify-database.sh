#!/bin/bash

# CogniFlow 数据库验证脚本
# 用于验证 PostgreSQL 数据库是否正确初始化

echo "🔍 开始验证 CogniFlow 数据库..."
echo "=================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 数据库连接信息
DB_USER="cogniflow_user"
DB_NAME="cogniflow"
CONTAINER_NAME="cogniflow-postgres"

# 检查 Docker 容器是否运行
echo "1️⃣  检查 Docker 容器状态..."
if docker ps | grep -q $CONTAINER_NAME; then
    echo -e "${GREEN}✅ 容器正在运行${NC}"
else
    echo -e "${RED}❌ 容器未运行，请先执行: docker-compose up -d${NC}"
    exit 1
fi
echo ""

# 检查数据库连接
echo "2️⃣  检查数据库连接..."
if docker exec $CONTAINER_NAME pg_isready -U $DB_USER -d $DB_NAME > /dev/null 2>&1; then
    echo -e "${GREEN}✅ 数据库连接正常${NC}"
else
    echo -e "${RED}❌ 无法连接到数据库${NC}"
    exit 1
fi
echo ""

# 检查表是否存在
echo "3️⃣  检查数据库表..."
TABLES=$(docker exec $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public';")
TABLES=$(echo $TABLES | tr -d '[:space:]')

if [ "$TABLES" -eq 9 ]; then
    echo -e "${GREEN}✅ 所有表已创建 (9个表)${NC}"
    echo ""
    docker exec $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;"
else
    echo -e "${YELLOW}⚠️  表数量: $TABLES (预期: 9)${NC}"
    echo ""
    docker exec $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;"
fi
echo ""

# 检查用户数据
echo "4️⃣  检查用户数据..."
USER_COUNT=$(docker exec $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM users;")
USER_COUNT=$(echo $USER_COUNT | tr -d '[:space:]')

if [ "$USER_COUNT" -ge 2 ]; then
    echo -e "${GREEN}✅ 用户数据正常 ($USER_COUNT 个用户)${NC}"
    docker exec $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -c "SELECT username, role, email FROM users;"
else
    echo -e "${YELLOW}⚠️  用户数量少于预期，当前: $USER_COUNT${NC}"
fi
echo ""

# 检查测试数据
echo "5️⃣  检查条目数据..."
ITEM_COUNT=$(docker exec $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM items;")
ITEM_COUNT=$(echo $ITEM_COUNT | tr -d '[:space:]')

if [ "$ITEM_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✅ 条目数据存在 ($ITEM_COUNT 个条目)${NC}"
    docker exec $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -c "SELECT type, COUNT(*) as count FROM items GROUP BY type ORDER BY type;"
else
    echo -e "${YELLOW}⚠️  未找到测试条目数据${NC}"
fi
echo ""

# 检查索引
echo "6️⃣  检查索引..."
INDEX_COUNT=$(docker exec $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public';")
INDEX_COUNT=$(echo $INDEX_COUNT | tr -d '[:space:]')

if [ "$INDEX_COUNT" -ge 20 ]; then
    echo -e "${GREEN}✅ 索引已创建 ($INDEX_COUNT 个索引)${NC}"
else
    echo -e "${YELLOW}⚠️  索引数量少于预期，当前: $INDEX_COUNT${NC}"
fi
echo ""

# 检查视图
echo "7️⃣  检查视图..."
VIEW_COUNT=$(docker exec $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM information_schema.views WHERE table_schema = 'public';")
VIEW_COUNT=$(echo $VIEW_COUNT | tr -d '[:space:]')

if [ "$VIEW_COUNT" -ge 2 ]; then
    echo -e "${GREEN}✅ 视图已创建 ($VIEW_COUNT 个视图)${NC}"
    docker exec $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -c "\dv"
else
    echo -e "${YELLOW}⚠️  视图数量不足，当前: $VIEW_COUNT${NC}"
fi
echo ""

# 检查扩展
echo "8️⃣  检查数据库扩展..."
if docker exec $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -t -c "SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp';" | grep -q 1; then
    echo -e "${GREEN}✅ uuid-ossp 扩展已安装${NC}"
else
    echo -e "${RED}❌ uuid-ossp 扩展未安装${NC}"
fi

if docker exec $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -t -c "SELECT 1 FROM pg_extension WHERE extname = 'pgcrypto';" | grep -q 1; then
    echo -e "${GREEN}✅ pgcrypto 扩展已安装${NC}"
else
    echo -e "${RED}❌ pgcrypto 扩展未安装${NC}"
fi
echo ""

# 测试管理员登录
echo "9️⃣  验证管理员账号..."
ADMIN_EXISTS=$(docker exec $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -t -c "SELECT username FROM users WHERE username = 'admin' AND role = 'admin';")
if echo "$ADMIN_EXISTS" | grep -q "admin"; then
    echo -e "${GREEN}✅ 管理员账号存在${NC}"
    echo "   用户名: admin"
    echo "   密码: admin123"
else
    echo -e "${RED}❌ 管理员账号不存在${NC}"
fi
echo ""

# 数据库大小
echo "🔟  数据库信息..."
DB_SIZE=$(docker exec $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -t -c "SELECT pg_size_pretty(pg_database_size('$DB_NAME'));")
echo "数据库大小: $DB_SIZE"
echo ""

# 总结
echo "=================================="
echo "✅ 验证完成！"
echo ""
echo "📋 接下来的步骤:"
echo "1. 访问 pgAdmin: http://localhost:5050"
echo "   邮箱: admin@example.com"
echo "   密码: admin123"
echo ""
echo "2. 安装后端依赖:"
echo "   ./scripts/install-db-deps.sh"
echo ""
echo "3. 查看完整文档:"
echo "   - DATABASE_QUICKSTART.md"
echo "   - DATABASE_GUIDE.md"
echo "   - DATABASE_INTEGRATION_SUMMARY.md"
echo ""
echo "🎉 数据库已就绪！"
