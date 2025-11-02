#!/bin/bash

# 时间冲突检测功能演示脚本
# 用于快速演示和测试时间冲突检测功能

echo "================================================"
echo "🔍 时间冲突检测功能演示"
echo "================================================"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📋 功能概述${NC}"
echo "----------------------------------------"
echo "✅ 自动检测日程事项之间的时间重叠"
echo "✅ 醒目的红色视觉标识"
echo "✅ 实时更新冲突状态"
echo "✅ 完整的测试覆盖"
echo ""

echo -e "${YELLOW}📁 创建的文件${NC}"
echo "----------------------------------------"
echo "1. src/utils/conflictDetector.ts"
echo "   - 时间冲突检测工具函数"
echo "   - hasTimeConflict() - 判断两个时间段是否冲突"
echo "   - detectConflicts() - 批量检测冲突"
echo ""

echo "2. server/routes/items.ts"
echo "   - detectTimeConflicts() - 检测单个事项冲突"
echo "   - updateConflictStatus() - 批量更新冲突状态"
echo "   - 在 CRUD 操作后自动更新冲突状态"
echo ""

echo "3. src/components/items/ItemCard.tsx"
echo "   - 冲突的视觉标识"
echo "   - 红色边框 + 淡红色背景"
echo "   - 冲突标签 + 警告图标"
echo "   - Tooltip 详细提示"
echo ""

echo "4. database/migrations/004_conflict_detection_optimization.sql"
echo "   - 冲突检测性能优化索引"
echo ""

echo "5. CONFLICT_DETECTION_FEATURE.md"
echo "   - 完整的功能文档"
echo ""

echo "6. CONFLICT_DETECTION_GUIDE.md"
echo "   - 详细的测试指南"
echo ""

echo "7. conflict-test.html"
echo "   - 可视化测试页面"
echo ""

echo -e "${GREEN}✨ 测试示例${NC}"
echo "----------------------------------------"
echo ""

echo -e "${YELLOW}示例 1: 完全重叠${NC}"
echo "输入: 今天下午2点开会"
echo "输入: 今天下午2点半有接待"
echo -e "${RED}结果: 两个事项都显示冲突标识${NC}"
echo ""

echo -e "${YELLOW}示例 2: 连续事项（不冲突）${NC}"
echo "输入: 今天上午9点会议，1小时"
echo "输入: 今天上午10点培训"
echo -e "${GREEN}结果: 两个事项都不显示冲突标识${NC}"
echo ""

echo -e "${BLUE}🚀 快速启动${NC}"
echo "----------------------------------------"
echo "1. 启动数据库:"
echo "   npm run db:start"
echo ""
echo "2. 启动后端服务器:"
echo "   npm run server"
echo ""
echo "3. 启动前端:"
echo "   npm run dev"
echo ""
echo "4. 打开测试页面:"
echo "   http://localhost:5173/conflict-test.html"
echo ""

echo -e "${GREEN}📊 视觉效果${NC}"
echo "----------------------------------------"
echo "冲突的事项会显示:"
echo "  🔴 红色左边框（4px）"
echo "  🌸 淡红色背景"
echo "  ⚠️  '时间冲突' 标签"
echo "  🔺 橙色警告图标"
echo "  💬 详细的 Tooltip 提示"
echo ""

echo -e "${BLUE}📖 相关文档${NC}"
echo "----------------------------------------"
echo "📄 CONFLICT_DETECTION_FEATURE.md - 功能说明"
echo "🧪 CONFLICT_DETECTION_GUIDE.md - 测试指南"
echo "🌐 conflict-test.html - 测试页面"
echo ""

echo -e "${GREEN}✅ 实现完成！${NC}"
echo "================================================"
echo ""
