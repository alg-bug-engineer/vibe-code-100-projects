#!/bin/bash
# Web UI 快速启动脚本

echo "🚀 CSDN自动发布系统 - Web UI 启动器"
echo "======================================"
echo ""

# 检查Python
if ! command -v python &> /dev/null; then
    echo "❌ Python未安装"
    exit 1
fi

# 检查Gradio
if ! python -c "import gradio" 2>/dev/null; then
    echo "⚠️  Gradio未安装，正在安装..."
    pip install gradio
fi

# 检查API Key
if [ -z "$ZHIPUAI_API_KEY" ]; then
    echo "⚠️  未检测到 ZHIPUAI_API_KEY 环境变量"
    echo "   您可以在Web界面中配置API Key"
    echo ""
fi

# 启动UI
echo "✓ 正在启动Web界面..."
echo "✓ 访问地址: http://localhost:7860"
echo ""

cd "$(dirname "$0")"
python ui.py
