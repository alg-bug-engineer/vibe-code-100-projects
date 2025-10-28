#!/usr/bin/env python3
"""
清理现有文章中的 markdown 代码块包裹标记
"""

from pathlib import Path
from zhipu_content_generator import ZhipuContentGenerator

def clean_existing_articles():
    """清理posts目录中现有文章的markdown包裹标记"""
    posts_dir = Path("posts")
    
    if not posts_dir.exists():
        print("posts目录不存在")
        return
    
    md_files = list(posts_dir.glob("*.md"))
    
    if not md_files:
        print("posts目录中没有md文件")
        return
    
    print(f"找到 {len(md_files)} 个文章文件")
    print("=" * 60)
    
    cleaned_count = 0
    
    for md_file in md_files:
        print(f"\n处理: {md_file.name}")
        
        # 读取文件内容
        with open(md_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 检查是否包含需要清理的标记
        if '```markdown' in content or content.strip().startswith('```'):
            # 分离标题和内容
            lines = content.split('\n')
            title_line = ""
            body_content = content
            
            # 如果第一行是标题
            if lines[0].startswith('# '):
                title_line = lines[0]
                body_content = '\n'.join(lines[1:]).strip()
            
            # 清理内容
            cleaned_body = ZhipuContentGenerator._clean_markdown_wrapper(body_content)
            
            # 重新组合
            if title_line:
                cleaned_content = f"{title_line}\n\n{cleaned_body}"
            else:
                cleaned_content = cleaned_body
            
            # 写回文件
            with open(md_file, 'w', encoding='utf-8') as f:
                f.write(cleaned_content)
            
            print(f"  ✓ 已清理")
            cleaned_count += 1
        else:
            print(f"  - 无需清理")
    
    print("\n" + "=" * 60)
    print(f"完成！共清理 {cleaned_count}/{len(md_files)} 个文件")


if __name__ == "__main__":
    clean_existing_articles()
