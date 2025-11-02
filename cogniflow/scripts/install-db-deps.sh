#!/bin/bash

echo "🚀 安装 PostgreSQL 相关依赖..."

# 安装 PostgreSQL 客户端库和类型定义
pnpm add pg
pnpm add -D @types/pg

# 安装 Express 和相关依赖（用于 API 服务器）
pnpm add express cors dotenv bcrypt jsonwebtoken
pnpm add -D @types/express @types/cors @types/bcrypt @types/jsonwebtoken

echo "✅ 依赖安装完成！"
