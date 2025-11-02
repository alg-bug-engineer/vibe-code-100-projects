#!/bin/bash

# CogniFlow 一键启动脚本（PostgreSQL 模式）

echo "🚀 启动 CogniFlow..."
echo ""

# 检查数据库是否运行
echo "1️⃣ 检查数据库状态..."
if ! docker ps | grep -q cogniflow-postgres; then
    echo "   启动数据库..."
    docker-compose up -d
    echo "   等待数据库就绪..."
    sleep 3
else
    echo "   ✅ 数据库已运行"
fi
echo ""

# 检查 concurrently 是否安装
if ! command -v concurrently &> /dev/null; then
    echo "📦 安装 concurrently..."
    pnpm add -D concurrently
fi

echo "2️⃣ 启动服务..."
echo ""
echo "📡 API 服务器: http://localhost:3001"
echo "🎨 前端应用: http://127.0.0.1:5173"
echo ""
echo "💡 按 Ctrl+C 停止所有服务"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 使用 concurrently 同时启动两个服务
pnpm exec concurrently \
  --names "API,APP" \
  --prefix-colors "cyan,magenta" \
  "cd server && pnpm tsx index.ts" \
  "pnpm run dev"
