#!/usr/bin/env python3
"""
完整示例：从生成到发布的完整流程演示
"""

import os
import sys
from pathlib import Path
from zhipu_content_generator import ZhipuContentGenerator


def demo_full_workflow():
    """演示完整的工作流程"""
    
    print("="*70)
    print("CSDN自动发布系统 - 完整工作流程演示")
    print("="*70)
    
    # 步骤1：检查环境
    print("\n【步骤1】检查环境配置...")
    api_key = os.environ.get("ZHIPUAI_API_KEY")
    if not api_key:
        print("❌ 错误：未设置环境变量 ZHIPUAI_API_KEY")
        print("\n请先设置：")
        print("  export ZHIPUAI_API_KEY='your-api-key'")
        return False
    
    print("✓ API Key 已配置")
    
    # 初始化生成器
    try:
        generator = ZhipuContentGenerator(api_key=api_key)
        print("✓ 智谱AI客户端初始化成功")
    except Exception as e:
        print(f"❌ 初始化失败：{e}")
        return False
    
    # 步骤2：生成标题
    print("\n【步骤2】生成文章标题...")
    keyword = "人工智能"
    print(f"关键词：{keyword}")
    
    try:
        titles = generator.generate_titles(keyword=keyword, count=5)
        print(f"✓ 成功生成 {len(titles)} 个标题：\n")
        for i, title in enumerate(titles, 1):
            print(f"  {i}. {title}")
    except Exception as e:
        print(f"❌ 生成标题失败：{e}")
        return False
    
    # 步骤3：保存标题到todo
    print("\n【步骤3】保存标题到todo目录...")
    try:
        todo_file = generator.save_titles_to_todo(titles)
        print(f"✓ 标题已保存：{todo_file}")
    except Exception as e:
        print(f"❌ 保存标题失败：{e}")
        return False
    
    # 步骤4：检查posts目录
    print("\n【步骤4】检查posts目录...")
    posts_dir = Path("posts")
    posts_dir.mkdir(exist_ok=True)
    
    current_count = len(list(posts_dir.glob("*.md")))
    max_count = 16
    available = max_count - current_count
    
    print(f"当前文章数：{current_count}/{max_count}")
    print(f"可用空间：{available} 篇")
    
    if available <= 0:
        print("⚠️  警告：posts目录已满，请先发布现有文章")
        return True  # 标题生成成功，但跳过文章生成
    
    # 步骤5：生成文章（只生成1篇作为示例）
    print("\n【步骤5】生成示例文章...")
    articles_to_generate = min(1, available)
    
    for i in range(articles_to_generate):
        title = titles[i]
        print(f"\n正在生成：{title}")
        
        try:
            article = generator.generate_article(title)
            filepath = generator.save_article_to_posts(title, article)
            print(f"✓ 文章已保存：{filepath}")
            
            # 显示文章预览（前200字符）
            preview = article[:200].replace('\n', ' ')
            print(f"\n文章预览：{preview}...\n")
            
        except Exception as e:
            print(f"❌ 生成文章失败：{e}")
            continue
    
    # 步骤6：提示下一步操作
    print("\n【步骤6】下一步操作...")
    print("="*70)
    print("✓ 内容生成完成！")
    print("\n现在可以运行发布脚本：")
    print("  python publish_csdn.py --headless false")
    print("\n或者继续生成更多文章：")
    print("  python auto_generate.py --generate-articles 5")
    print("="*70)
    
    return True


def demo_title_generation():
    """演示标题生成功能"""
    
    print("\n" + "="*70)
    print("演示：标题生成")
    print("="*70 + "\n")
    
    try:
        generator = ZhipuContentGenerator()
        
        # 示例1：基于关键词
        print("【示例1】基于关键词 '大模型' 生成标题")
        titles1 = generator.generate_titles(keyword="大模型", count=3)
        for i, title in enumerate(titles1, 1):
            print(f"  {i}. {title}")
        
        print("\n" + "-"*70 + "\n")
        
        # 示例2：基于最新趋势
        print("【示例2】基于最新技术趋势生成标题")
        titles2 = generator.generate_titles(keyword=None, count=3)
        for i, title in enumerate(titles2, 1):
            print(f"  {i}. {title}")
        
        print("\n" + "="*70)
        
    except Exception as e:
        print(f"错误：{e}")


def demo_article_generation():
    """演示文章生成功能"""
    
    print("\n" + "="*70)
    print("演示：文章生成")
    print("="*70 + "\n")
    
    try:
        generator = ZhipuContentGenerator()
        
        title = "Python异步编程完全指南"
        print(f"根据标题生成文章：{title}\n")
        
        article = generator.generate_article(title)
        
        # 显示文章统计信息
        lines = article.split('\n')
        words = len(article)
        
        print(f"✓ 文章生成成功")
        print(f"  行数：{len(lines)}")
        print(f"  字符数：{words}")
        print(f"\n文章内容预览（前500字符）：")
        print("-"*70)
        print(article[:500])
        print("-"*70)
        
    except Exception as e:
        print(f"错误：{e}")


def print_menu():
    """打印菜单"""
    print("\n" + "="*70)
    print("CSDN自动发布系统 - 功能演示")
    print("="*70)
    print("\n请选择演示功能：")
    print("  1. 完整工作流程（推荐）")
    print("  2. 仅演示标题生成")
    print("  3. 仅演示文章生成")
    print("  0. 退出")
    print("\n" + "="*70)


def main():
    """主函数"""
    
    # 检查API Key
    if not os.environ.get("ZHIPUAI_API_KEY"):
        print("\n" + "="*70)
        print("⚠️  请先设置智谱AI API Key")
        print("="*70)
        print("\n设置方法：")
        print("  export ZHIPUAI_API_KEY='your-api-key'")
        print("\n或在代码中直接提供API Key")
        print("="*70 + "\n")
        sys.exit(1)
    
    if len(sys.argv) > 1:
        # 命令行模式
        choice = sys.argv[1]
    else:
        # 交互模式
        print_menu()
        choice = input("\n请输入选项 (0-3): ").strip()
    
    if choice == "1":
        demo_full_workflow()
    elif choice == "2":
        demo_title_generation()
    elif choice == "3":
        demo_article_generation()
    elif choice == "0":
        print("再见！")
    else:
        print("无效的选项")
        print("\n直接运行完整流程...")
        demo_full_workflow()


if __name__ == "__main__":
    main()
