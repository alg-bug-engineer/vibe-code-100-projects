#!/usr/bin/env python3
"""
auto_generate_daily.py

每日自动化内容生成主程序
- 基于智谱Web Search搜索最新技术新闻
- 自动生成15篇文章
- 完全自动化，无需手动输入关键词
"""

import argparse
import sys
import json
from pathlib import Path
from datetime import datetime
from zhipu_news_search import ZhipuNewsSearcher
from zhipu_content_generator import ZhipuContentGenerator


def count_files_in_directory(directory: Path, extension: str = ".md") -> int:
    """统计目录中指定扩展名的文件数量"""
    if not directory.exists():
        return 0
    return len(list(directory.glob(f"*{extension}")))


def load_titles_info_from_json(json_file: Path) -> list:
    """
    从JSON文件加载标题信息
    
    Args:
        json_file: JSON文件路径
        
    Returns:
        标题信息列表
    """
    if not json_file.exists():
        return []
    
    with open(json_file, 'r', encoding='utf-8') as f:
        return json.load(f)


def generate_article_with_context(
    generator: ZhipuContentGenerator,
    title: str,
    summary: str,
    topic: str
) -> str:
    """
    基于新闻上下文生成文章
    
    Args:
        generator: 内容生成器
        title: 文章标题
        summary: 新闻摘要
        topic: 主题
        
    Returns:
        Markdown格式的文章
    """
    prompt = f"""作为一名资深的技术博客作者，请根据以下信息撰写一篇高质量的技术博客文章。

文章标题: {title}
主题领域: {topic}
新闻背景: {summary}

要求：
1. 使用Markdown格式撰写
2. 文章结构完整，包含：
   - 引言（介绍背景和重要性）
   - 技术详解（深入分析技术原理）
   - 应用场景（实际应用案例）
   - 未来展望（技术发展趋势）
   - 总结（要点回顾）
3. 内容要专业、准确、有深度
4. 适当使用代码示例、图表说明（Markdown格式）
5. 字数在2000-3000字之间
6. 使用二级标题（##）划分章节
7. 内容要结合最新技术动态和实际应用
8. 语言简洁明了，逻辑清晰
9. 不要在开头重复标题
10. 文章要有独到见解，避免泛泛而谈

请直接输出Markdown格式的文章正文（不包含一级标题）："""
    
    try:
        response = generator.client.chat.completions.create(
            model="glm-4-plus",  # 使用强大模型生成高质量文章
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=8000
        )
        
        content = response.choices[0].message.content.strip()
        
        # 清理可能的代码块标记
        content = generator._clean_markdown_wrapper(content)
        
        # 构建完整文章
        article = f"# {title}\n\n{content}"
        
        return article
        
    except Exception as e:
        print(f"生成文章时出错: {e}")
        raise


def main():
    parser = argparse.ArgumentParser(
        description="每日自动化技术博客生成系统",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例用法：

  # 默认：搜索昨天的新闻，生成15篇文章
  python auto_generate_daily.py
  
  # 只搜索新闻和生成标题，不生成文章
  python auto_generate_daily.py --search-only
  
  # 搜索最近3天的新闻
  python auto_generate_daily.py --days 3
  
  # 生成指定数量的文章
  python auto_generate_daily.py --count 10
  
  # 使用自定义主题
  python auto_generate_daily.py --topics "大模型" "AGI" "多模态AI"
  
  # 从已有的标题信息生成文章
  python auto_generate_daily.py --from-existing --articles 5
        """
    )
    
    parser.add_argument(
        "--search-only",
        action="store_true",
        help="只搜索新闻和生成标题，不生成文章"
    )
    
    parser.add_argument(
        "--from-existing",
        action="store_true",
        help="从今天已有的标题信息生成文章（跳过搜索）"
    )
    
    parser.add_argument(
        "--days",
        type=int,
        default=1,
        help="搜索最近几天的新闻（默认1天）"
    )
    
    parser.add_argument(
        "--count",
        type=int,
        default=15,
        help="目标生成数量（默认15个）"
    )
    
    parser.add_argument(
        "--articles",
        type=int,
        default=None,
        help="生成文章数量（不指定则生成所有标题）"
    )
    
    parser.add_argument(
        "--topics",
        nargs="+",
        default=None,
        help="指定搜索主题（空格分隔）"
    )
    
    parser.add_argument(
        "--posts-limit",
        type=int,
        default=16,
        help="posts目录文章数量限制（默认16篇）"
    )
    
    args = parser.parse_args()
    
    # 初始化路径
    posts_dir = Path("posts")
    todo_dir = Path("todo")
    posts_dir.mkdir(exist_ok=True)
    todo_dir.mkdir(exist_ok=True)
    
    today = datetime.now().strftime("%Y%m%d")
    titles_json = todo_dir / f"{today}_titles_info.json"
    
    try:
        print("\n" + "="*70)
        print("每日自动化技术博客生成系统")
        print("="*70)
        
        # 场景1：从已有标题生成文章
        if args.from_existing:
            if not titles_json.exists():
                print(f"\n错误: 未找到今天的标题信息文件 {titles_json}")
                print("请先运行搜索: python auto_generate_daily.py --search-only")
                sys.exit(1)
            
            print(f"\n从现有标题文件生成文章: {titles_json}")
            titles_info = load_titles_info_from_json(titles_json)
            
        else:
            # 搜索新闻并生成标题
            print("\n步骤1: 搜索最新技术新闻")
            print("-"*70)
            
            searcher = ZhipuNewsSearcher()
            
            # 搜索新闻
            news_items = searcher.search_tech_news(
                topics=args.topics,
                days_back=args.days,
                max_results_per_topic=3
            )
            
            if not news_items:
                print("未找到相关新闻")
                sys.exit(1)
            
            # 保存新闻信息
            searcher.save_news_info(news_items, todo_dir)
            
            # 生成标题
            print("\n步骤2: 基于新闻生成文章标题")
            print("-"*70)
            
            titles_info = searcher.generate_titles_from_news(news_items, args.count)
            
            if not titles_info:
                print("标题生成失败")
                sys.exit(1)
            
            # 保存标题
            searcher.save_titles_with_info(titles_info, todo_dir)
        
        # 如果只搜索，到此结束
        if args.search_only:
            print(f"\n{'='*70}")
            print(f"搜索完成！生成了 {len(titles_info)} 个标题")
            print("运行以下命令生成文章:")
            print(f"  python auto_generate_daily.py --from-existing --articles 15")
            print(f"{'='*70}\n")
            return 0
        
        # 步骤3: 生成文章
        print("\n步骤3: 生成技术博客文章")
        print("-"*70)
        
        # 检查posts目录容量
        current_posts_count = count_files_in_directory(posts_dir, ".md")
        available_slots = args.posts_limit - current_posts_count
        
        print(f"\nposts目录状态: {current_posts_count}/{args.posts_limit} 篇文章")
        print(f"可用位置: {available_slots} 个\n")
        
        if available_slots <= 0:
            print(f"错误: posts目录已达到上限（{args.posts_limit}篇）")
            print("请先发布或移除一些文章后再生成新内容")
            sys.exit(1)
        
        # 确定实际生成数量
        articles_to_generate = args.articles or len(titles_info)
        articles_to_generate = min(articles_to_generate, available_slots, len(titles_info))
        
        if articles_to_generate < (args.articles or len(titles_info)):
            print(f"警告: 请求生成 {args.articles or len(titles_info)} 篇，但只有 {available_slots} 个可用位置")
            print(f"将生成 {articles_to_generate} 篇文章\n")
        
        # 初始化生成器
        generator = ZhipuContentGenerator()
        
        # 生成文章
        success_count = 0
        failed_titles = []
        
        for i in range(articles_to_generate):
            info = titles_info[i]
            title = info['title']
            summary = info.get('summary', '')
            topic = info.get('topic', '')
            
            print(f"\n[{i+1}/{articles_to_generate}] 正在生成文章:")
            print(f"  标题: {title}")
            print(f"  主题: {topic}")
            
            try:
                # 基于上下文生成文章
                article = generate_article_with_context(
                    generator, 
                    title, 
                    summary, 
                    topic
                )
                
                # 保存文章
                generator.save_article_to_posts(title, article, posts_dir)
                success_count += 1
                print(f"  ✓ 生成成功")
                
            except Exception as e:
                print(f"  ✗ 生成失败: {e}")
                failed_titles.append(title)
                continue
        
        # 输出总结
        print(f"\n{'='*70}")
        print(f"生成完成！")
        print(f"{'='*70}")
        print(f"成功: {success_count}/{articles_to_generate} 篇文章")
        print(f"posts目录现有: {count_files_in_directory(posts_dir, '.md')} 篇文章")
        
        if failed_titles:
            print(f"\n失败的文章 ({len(failed_titles)}):")
            for title in failed_titles:
                print(f"  - {title}")
        
        print(f"\n下一步: 运行发布脚本")
        print(f"  python publish_csdn.py --headless false")
        print(f"{'='*70}\n")
        
        return 0
        
    except ValueError as e:
        print(f"\n配置错误: {e}")
        print("请确保已设置环境变量 ZHIPUAI_API_KEY")
        sys.exit(1)
    except Exception as e:
        print(f"\n执行出错: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    sys.exit(main())
