#!/usr/bin/env python3
"""
demo_daily_generate.py

演示每日自动生成功能
"""

import os


def print_section(title):
    """打印章节标题"""
    print("\n" + "="*70)
    print(title)
    print("="*70 + "\n")


def check_environment():
    """检查环境"""
    print_section("1. 环境检查")
    
    api_key = os.environ.get("ZHIPUAI_API_KEY")
    if api_key:
        print(f"✓ API Key 已设置（前10位: {api_key[:10]}...）")
        return True
    else:
        print("✗ API Key 未设置")
        print("\n请先设置：")
        print("  export ZHIPUAI_API_KEY='your-api-key'")
        return False


def demo_basic_usage():
    """演示基本用法"""
    print_section("2. 基本使用演示")
    
    print("【场景1】完整流程 - 一键生成")
    print("-" * 70)
    print("命令：python auto_generate_daily.py")
    print("\n执行流程：")
    print("  1️⃣  搜索昨天的技术新闻（15个领域）")
    print("  2️⃣  提取15条关键技术动态")
    print("  3️⃣  生成15个优化的博客标题")
    print("  4️⃣  基于新闻背景生成15篇文章")
    print("  5️⃣  保存到 posts/ 目录")
    
    print("\n" + "-" * 70)
    print("【场景2】分步执行 - 更灵活")
    print("-" * 70)
    print("步骤1: python auto_generate_daily.py --search-only")
    print("  ➜ 搜索新闻并生成标题")
    print("  ➜ 输出: todo/YYYYMMDD_titles_info.json")
    print("\n步骤2: python auto_generate_daily.py --from-existing --articles 5")
    print("  ➜ 从已有标题生成5篇文章")
    print("  ➜ 可以多次运行，分批生成")


def demo_custom_options():
    """演示自定义选项"""
    print_section("3. 自定义选项演示")
    
    examples = [
        {
            "title": "搜索最近3天的新闻",
            "command": "python auto_generate_daily.py --days 3",
            "desc": "适合周末后使用，获取更多新闻"
        },
        {
            "title": "指定搜索主题",
            "command": 'python auto_generate_daily.py --topics "大模型" "AGI" "多模态AI"',
            "desc": "只关注特定技术领域"
        },
        {
            "title": "生成指定数量",
            "command": "python auto_generate_daily.py --count 10 --articles 10",
            "desc": "减少生成数量，节省API调用"
        },
        {
            "title": "只生成部分文章",
            "command": "python auto_generate_daily.py --from-existing --articles 3",
            "desc": "从已有标题中只生成3篇"
        }
    ]
    
    for i, example in enumerate(examples, 1):
        print(f"示例 {i}: {example['title']}")
        print(f"  命令: {example['command']}")
        print(f"  说明: {example['desc']}")
        print()


def demo_workflow():
    """演示工作流程"""
    print_section("4. 推荐工作流程")
    
    print("【工作流1】每日自动化")
    print("-" * 70)
    print("1️⃣  早上8点（定时任务）：")
    print("   python auto_generate_daily.py --articles 10")
    print("   ➜ 自动生成10篇基于昨天新闻的文章")
    print("\n2️⃣  下午3点（定时任务）：")
    print("   python publish_csdn.py")
    print("   ➜ 自动发布到CSDN")
    
    print("\n" + "-" * 70)
    print("【工作流2】人工审核")
    print("-" * 70)
    print("1️⃣  搜索和生成标题：")
    print("   python auto_generate_daily.py --search-only")
    print("\n2️⃣  查看和筛选标题：")
    print("   cat todo/$(date +%Y%m%d)_titles.txt")
    print("\n3️⃣  生成部分文章：")
    print("   python auto_generate_daily.py --from-existing --articles 5")
    print("\n4️⃣  人工审阅和修改")
    print("\n5️⃣  发布：")
    print("   python publish_csdn.py --headless false")
    
    print("\n" + "-" * 70)
    print("【工作流3】批量准备")
    print("-" * 70)
    print("周一：搜索周末新闻")
    print("   python auto_generate_daily.py --days 2 --search-only")
    print("\n周二-周五：每天生成3篇")
    print("   python auto_generate_daily.py --from-existing --articles 3")


def demo_output_files():
    """演示输出文件"""
    print_section("5. 输出文件说明")
    
    print("生成的文件：")
    print("\n📁 todo/")
    print("  ├─ YYYYMMDD_news.json")
    print("  │  └─ 原始新闻数据（包含主题、标题、摘要、来源、日期）")
    print("  │")
    print("  ├─ YYYYMMDD_titles_info.json")
    print("  │  └─ 标题详细信息（包含优化后标题、摘要、主题、原标题）")
    print("  │")
    print("  └─ YYYYMMDD_titles.txt")
    print("     └─ 纯标题列表（兼容旧系统）")
    print("\n📁 posts/")
    print("  ├─ 标题1.md")
    print("  ├─ 标题2.md")
    print("  └─ ...")


def demo_cost_optimization():
    """演示成本优化"""
    print_section("6. 成本优化建议")
    
    print("API调用量估算：")
    print("-" * 70)
    print("  新闻搜索：5次  （glm-4-flash）")
    print("  信息提取：5次  （glm-4-flash）")
    print("  标题优化：15次 （glm-4-flash）")
    print("  文章生成：15次 （glm-4-plus）")
    print("  " + "-" * 50)
    print("  总计：约40次API调用")
    
    print("\n优化方案：")
    print("-" * 70)
    print("方案1: 减少生成数量")
    print("  python auto_generate_daily.py --count 10 --articles 10")
    print("  ➜ 减少到约25次调用")
    
    print("\n方案2: 分批生成")
    print("  # 第1天")
    print("  python auto_generate_daily.py --search-only")
    print("  # 第2-4天，每天生成5篇")
    print("  python auto_generate_daily.py --from-existing --articles 5")
    print("  ➜ 分散API调用")
    
    print("\n方案3: 减少搜索主题")
    print("  python auto_generate_daily.py --topics '大模型' 'AI' --count 10")
    print("  ➜ 减少到约20次调用")


def demo_comparison():
    """功能对比"""
    print_section("7. 新旧功能对比")
    
    print("┌─────────────────┬──────────────────────┬────────────────────────┐")
    print("│     特性        │  旧版 (auto_generate)│ 新版 (auto_generate_   │")
    print("│                 │                      │       daily)           │")
    print("├─────────────────┼──────────────────────┼────────────────────────┤")
    print("│ 关键词来源      │ 手动输入             │ 自动搜索新闻           │")
    print("│ 内容时效性      │ 依赖手动更新         │ 实时（昨天）           │")
    print("│ 标题质量        │ AI生成               │ 基于真实新闻优化       │")
    print("│ 文章背景        │ 通用模板             │ 结合新闻上下文         │")
    print("│ 自动化程度      │ 半自动               │ 全自动                 │")
    print("│ 技术领域        │ 单一关键词           │ 15个技术领域           │")
    print("└─────────────────┴──────────────────────┴────────────────────────┘")


def main():
    """主函数"""
    print("\n" + "="*70)
    print("每日自动化内容生成功能 - 演示")
    print("="*70)
    
    # 检查环境
    if not check_environment():
        print("\n⚠️  请先配置API Key后再继续")
        return
    
    # 演示各项功能
    demo_basic_usage()
    demo_custom_options()
    demo_workflow()
    demo_output_files()
    demo_cost_optimization()
    demo_comparison()
    
    # 总结
    print_section("8. 开始使用")
    
    print("立即体验：")
    print("\n方式1: 使用启动脚本（推荐）")
    print("  ./start.sh")
    print("  # 选择选项 5: 每日自动生成")
    
    print("\n方式2: 直接运行")
    print("  python auto_generate_daily.py")
    
    print("\n方式3: 先搜索后生成")
    print("  python auto_generate_daily.py --search-only")
    print("  python auto_generate_daily.py --from-existing --articles 5")
    
    print("\n📚 详细文档：")
    print("  cat DAILY_AUTO_GENERATE.md")
    
    print("\n💡 获取帮助：")
    print("  python auto_generate_daily.py --help")
    
    print("\n" + "="*70)
    print("祝你使用愉快！🎉")
    print("="*70 + "\n")


if __name__ == "__main__":
    main()
