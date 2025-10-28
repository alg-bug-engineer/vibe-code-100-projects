#!/bin/bash
# 一键启动脚本 - CSDN自动发布系统

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 显示标题
echo ""
echo "======================================================================"
echo "               CSDN自动发布系统 - 一键启动脚本"
echo "======================================================================"
echo ""

# 检查Python
if ! command -v python3 &> /dev/null; then
    print_error "Python3 未安装"
    exit 1
fi

print_success "Python3 已安装: $(python3 --version)"

# 检查虚拟环境
if [ ! -d ".venv" ]; then
    print_info "创建虚拟环境..."
    python3 -m venv .venv
    print_success "虚拟环境创建完成"
fi

# 激活虚拟环境
print_info "激活虚拟环境..."
source .venv/bin/activate

# 安装依赖
print_info "检查并安装依赖..."
pip install -q -r requirements.txt

# 检查Playwright
if ! python -c "from playwright.sync_api import sync_playwright" 2>/dev/null; then
    print_info "安装Playwright浏览器..."
    python -m playwright install
    print_success "Playwright浏览器安装完成"
fi

# 检查API Key
if [ -z "$ZHIPUAI_API_KEY" ]; then
    print_warning "环境变量 ZHIPUAI_API_KEY 未设置"
    echo ""
    read -p "请输入你的智谱AI API Key (或按Enter跳过): " api_key
    
    if [ ! -z "$api_key" ]; then
        export ZHIPUAI_API_KEY="$api_key"
        print_success "API Key 已设置"
    else
        print_warning "跳过API Key设置，某些功能可能无法使用"
    fi
else
    print_success "API Key 已配置"
fi

# 创建必要的目录
mkdir -p posts todo

# 显示菜单
echo ""
echo "======================================================================"
echo "请选择操作："
echo "  1. 🌐 启动Web界面（推荐）- 可视化操作"
echo "  2. 运行系统测试"
echo "  3. 生成内容（标题+文章）"
echo "  4. 只生成标题"
echo "  5. 生成多篇文章"
echo "  6. 🆕 每日自动生成 - 基于新闻搜索"
echo "  7. 发布到CSDN"
echo "  8. 运行演示"
echo "  9. 查看帮助"
echo "  0. 退出"
echo "======================================================================"
echo ""

read -p "请输入选项 (0-9): " choice

case $choice in
    1)
        print_info "🌐 启动Web界面..."
        print_success "界面将在浏览器中自动打开"
        print_info "默认地址: http://localhost:7860"
        echo ""
        python ui.py
        ;;
    2)
        print_info "运行系统测试..."
        python test_system.py
        ;;
    3)
        read -p "请输入关键词 (留空使用最新趋势): " keyword
        if [ -z "$keyword" ]; then
            python auto_generate.py
        else
            python auto_generate.py --keyword "$keyword"
        fi
        ;;
    4)
        read -p "生成多少个标题？(默认10): " count
        count=${count:-10}
        read -p "请输入关键词 (留空使用最新趋势): " keyword
        if [ -z "$keyword" ]; then
            python auto_generate.py --titles-only --count $count
        else
            python auto_generate.py --titles-only --count $count --keyword "$keyword"
        fi
        ;;
    5)
        read -p "生成多少篇文章？(默认5): " articles
        articles=${articles:-5}
        python auto_generate.py --generate-articles $articles
        ;;
    6)
        print_info "🆕 每日自动生成 - 基于智谱Web Search"
        echo ""
        echo "这个功能将："
        echo "  1. 搜索昨天的大模型、AI、智能体等领域新闻"
        echo "  2. 自动生成15个技术博客标题"
        echo "  3. 基于新闻内容生成高质量文章"
        echo ""
        read -p "是否继续？(y/n): " confirm
        if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
            read -p "生成多少篇文章？(默认15): " articles
            articles=${articles:-15}
            python auto_generate_daily.py --articles $articles
        fi
        ;;
    7)
        print_info "启动CSDN发布程序..."
        print_warning "首次运行需要在浏览器中登录CSDN"
        python publish_csdn.py --headless false
        ;;
    8)
        print_info "运行功能演示..."
        python demo.py 1
        ;;
    9)
        print_info "显示帮助信息..."
        echo ""
        echo "命令行使用方法："
        echo ""
        echo "  # 启动Web界面（推荐）"
        echo "  python ui.py"
        echo ""
        echo "  # 生成内容"
        echo "  python auto_generate.py --keyword '关键词' --generate-articles 5"
        echo ""
        echo "  # 每日自动生成"
        echo "  python auto_generate_daily.py --articles 10"
        echo ""
        echo "  # 发布文章"
        echo "  python publish_csdn.py"
        echo ""
        echo "  # 查看详细帮助"
        echo "  python auto_generate.py --help"
        echo "  python auto_generate_daily.py --help"
        echo "  python publish_csdn.py --help"
        echo ""
        echo "更多信息请查看: README_NEW.md 或 QUICKSTART.md"
        echo ""
        ;;
    0)
        print_info "退出"
        exit 0
        ;;
    *)
        print_error "无效的选项"
        exit 1
        ;;
esac

print_success "操作完成！"
echo ""
