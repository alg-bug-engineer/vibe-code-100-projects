#!/usr/bin/env python3
"""
auto_generate.py

自动生成内容的主流程脚本
- 读取关键词生成标题
- 根据标题生成文章
- 自动管理posts和todo目录
"""

import argparse
import sys
from pathlib import Path
from datetime import datetime
from zhipu_content_generator import ZhipuContentGenerator


def read_keywords_from_file(keywords_file: Path) -> list:
    """
    从keywords.txt读取关键词
    
    Args:
        keywords_file: 关键词文件路径
        
    Returns:
        关键词列表（去除空行和空白）
    """
    if not keywords_file.exists():
        return []
    
    with open(keywords_file, 'r', encoding='utf-8') as f:
        keywords = [line.strip() for line in f if line.strip()]
    
    return keywords


def count_files_in_directory(directory: Path, extension: str = ".md") -> int:
    """
    统计目录中指定扩展名的文件数量
    
    Args:
        directory: 目录路径
        extension: 文件扩展名
        
    Returns:
        文件数量
    """
    if not directory.exists():
        return 0
    
    return len(list(directory.glob(f"*{extension}")))


def main():
    parser = argparse.ArgumentParser(
        description="自动生成技术博客文章并管理发布队列",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例用法：
  # 使用keywords.txt中的关键词生成10个标题和文章
  python auto_generate.py
  
  # 使用指定关键词生成
  python auto_generate.py --keyword "人工智能"
  
  # 生成5篇文章
  python auto_generate.py --count 5
  
  # 只生成标题，不生成文章
  python auto_generate.py --titles-only
  
  # 生成指定数量的文章（会检查posts目录限制）
  python auto_generate.py --generate-articles 3
        """
    )
    
    parser.add_argument(
        "--keyword",
        type=str,
        default=None,
        help="指定关键词，如果不指定则从keywords.txt读取第一个关键词，如果文件为空则使用最新技术趋势"
    )
    
    parser.add_argument(
        "--count",
        type=int,
        default=10,
        help="生成标题的数量（默认10个）"
    )
    
    parser.add_argument(
        "--titles-only",
        action="store_true",
        help="只生成标题，不生成文章内容"
    )
    
    parser.add_argument(
        "--generate-articles",
        type=int,
        default=0,
        help="生成指定数量的文章。会从todo目录读取标题或新生成标题。注意：posts目录最多16篇文章"
    )
    
    parser.add_argument(
        "--posts-limit",
        type=int,
        default=16,
        help="posts目录文章数量限制（默认16篇）"
    )
    
    parser.add_argument(
        "--keywords-file",
        type=str,
        default="keywords.txt",
        help="关键词文件路径（默认keywords.txt）"
    )
    
    args = parser.parse_args()
    
    # 初始化路径
    posts_dir = Path("posts")
    todo_dir = Path("todo")
    keywords_file = Path(args.keywords_file)
    
    # 确保目录存在
    posts_dir.mkdir(exist_ok=True)
    todo_dir.mkdir(exist_ok=True)
    
    try:
        # 初始化生成器
        generator = ZhipuContentGenerator()
        
        # 确定使用的关键词
        keyword = args.keyword
        if not keyword:
            keywords = read_keywords_from_file(keywords_file)
            if keywords:
                keyword = keywords[0]
                print(f"从 {keywords_file} 读取关键词: {keyword}")
            else:
                print(f"{keywords_file} 为空或不存在，将使用最新技术趋势生成内容")
        
        # 场景1：只生成标题
        if args.titles_only:
            print(f"\n{'='*60}")
            print(f"生成 {args.count} 个标题{'（关键词: ' + keyword + '）' if keyword else '（基于最新技术趋势）'}...")
            print(f"{'='*60}\n")
            
            titles = generator.generate_titles(keyword=keyword, count=args.count)
            
            print(f"\n成功生成 {len(titles)} 个标题：")
            for i, title in enumerate(titles, 1):
                print(f"{i}. {title}")
            
            # 保存到todo目录
            generator.save_titles_to_todo(titles, todo_dir)
            
            print(f"\n✓ 标题已保存到todo目录")
            return
        
        # 场景2：生成指定数量的文章
        if args.generate_articles > 0:
            # 检查posts目录当前文章数
            current_posts_count = count_files_in_directory(posts_dir, ".md")
            available_slots = args.posts_limit - current_posts_count
            
            print(f"\n{'='*60}")
            print(f"posts目录状态: {current_posts_count}/{args.posts_limit} 篇文章")
            print(f"可用位置: {available_slots} 个")
            print(f"{'='*60}\n")
            
            if available_slots <= 0:
                print(f"错误: posts目录已达到上限（{args.posts_limit}篇），无法生成更多文章")
                print("请先发布或移除一些文章后再生成新内容")
                sys.exit(1)
            
            # 确定实际生成数量
            articles_to_generate = min(args.generate_articles, available_slots)
            
            if articles_to_generate < args.generate_articles:
                print(f"警告: 请求生成 {args.generate_articles} 篇文章，但只有 {available_slots} 个可用位置")
                print(f"将只生成 {articles_to_generate} 篇文章\n")
            
            # 尝试从todo目录读取今天的标题文件
            today = datetime.now().strftime("%Y%m%d")
            today_titles_file = todo_dir / f"{today}_titles.txt"
            
            titles = []
            if today_titles_file.exists():
                print(f"从 {today_titles_file} 读取标题...")
                with open(today_titles_file, 'r', encoding='utf-8') as f:
                    for line in f:
                        line = line.strip()
                        # 移除序号
                        line = line.lstrip('0123456789.、-》> ').strip()
                        if line:
                            titles.append(line)
                print(f"读取到 {len(titles)} 个标题\n")
            
            # 如果没有足够的标题，生成新标题
            if len(titles) < articles_to_generate:
                needed = articles_to_generate - len(titles)
                print(f"需要生成额外 {needed} 个标题...")
                new_titles = generator.generate_titles(keyword=keyword, count=needed)
                titles.extend(new_titles)
                
                # 保存所有标题到todo
                generator.save_titles_to_todo(titles, todo_dir)
            
            # 生成文章
            print(f"\n{'='*60}")
            print(f"开始生成 {articles_to_generate} 篇文章...")
            print(f"{'='*60}\n")
            
            success_count = 0
            for i in range(articles_to_generate):
                title = titles[i]
                print(f"\n[{i+1}/{articles_to_generate}] 正在生成文章: {title}")
                
                try:
                    article = generator.generate_article(title)
                    generator.save_article_to_posts(title, article, posts_dir)
                    success_count += 1
                    print(f"✓ 文章生成成功")
                except Exception as e:
                    print(f"✗ 文章生成失败: {e}")
                    continue
            
            print(f"\n{'='*60}")
            print(f"完成！成功生成 {success_count}/{articles_to_generate} 篇文章")
            print(f"posts目录现有: {count_files_in_directory(posts_dir, '.md')} 篇文章")
            print(f"{'='*60}\n")
            
            return
        
        # 场景3：默认行为 - 生成标题并生成第一篇文章作为示例
        print(f"\n{'='*60}")
        print(f"生成 {args.count} 个标题{'（关键词: ' + keyword + '）' if keyword else '（基于最新技术趋势）'}...")
        print(f"{'='*60}\n")
        
        titles = generator.generate_titles(keyword=keyword, count=args.count)
        
        print(f"\n成功生成 {len(titles)} 个标题：")
        for i, title in enumerate(titles, 1):
            print(f"{i}. {title}")
        
        # 保存标题到todo
        generator.save_titles_to_todo(titles, todo_dir)
        
        # 检查posts目录是否还有空间
        current_posts_count = count_files_in_directory(posts_dir, ".md")
        if current_posts_count >= args.posts_limit:
            print(f"\n警告: posts目录已达到上限（{args.posts_limit}篇），跳过文章生成")
            print("请先发布或移除一些文章后再生成新内容")
        else:
            # 生成第一篇文章作为示例
            print(f"\n{'='*60}")
            print(f"生成第一篇文章作为示例...")
            print(f"{'='*60}\n")
            
            article = generator.generate_article(titles[0])
            generator.save_article_to_posts(titles[0], article, posts_dir)
            
            print(f"\n✓ 示例文章已生成")
            print(f"posts目录现有: {count_files_in_directory(posts_dir, '.md')} 篇文章")
        
        print(f"\n{'='*60}")
        print("完成！")
        print(f"{'='*60}\n")
        
    except ValueError as e:
        print(f"配置错误: {e}")
        print("\n请确保已设置环境变量 ZHIPUAI_API_KEY")
        print("或在代码中提供API密钥")
        sys.exit(1)
    except Exception as e:
        print(f"执行出错: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
