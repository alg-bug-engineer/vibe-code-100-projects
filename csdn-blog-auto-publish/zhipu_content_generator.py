#!/usr/bin/env python3
"""
zhipu_content_generator.py

使用智谱AI API生成文章标题和内容
"""

import os
import json
from datetime import datetime
from pathlib import Path
from typing import List, Optional
from zhipuai import ZhipuAI


class ZhipuContentGenerator:
    """智谱AI内容生成器"""
    
    def __init__(self, api_key: Optional[str] = None):
        """
        初始化智谱AI客户端
        
        Args:
            api_key: API密钥，如果为None则从环境变量ZHIPUAI_API_KEY读取
        """
        self.api_key = api_key or os.environ.get("ZHIPUAI_API_KEY")
        if not self.api_key:
            raise ValueError("请提供智谱AI API Key，或设置环境变量 ZHIPUAI_API_KEY")
        
        self.client = ZhipuAI(api_key=self.api_key)
        
    def generate_titles(self, keyword: Optional[str] = None, count: int = 10) -> List[str]:
        """
        生成文章标题
        
        Args:
            keyword: 关键词，如果为None则使用最新新闻作为主题
            count: 生成标题数量，默认10个
            
        Returns:
            标题列表
        """
        if keyword:
            prompt = f"""作为一名专业的技术博客作者，请围绕关键词"{keyword}"生成{count}个吸引人的技术博客标题。
要求：
1. 标题要专业且具有吸引力
2. 适合技术博客平台（如CSDN）发布
3. 每个标题独立一行
4. 标题长度在10-30个字之间
5. 标题要体现技术深度和实用性
6. 不要包含序号，直接输出标题

请直接输出{count}个标题，每行一个："""
        else:
            prompt = f"""作为一名专业的技术博客作者，请基于当前科技领域的最新趋势和热门话题，生成{count}个吸引人的技术博客标题。
要求：
1. 标题要专业且具有吸引力
2. 涵盖人工智能、云计算、大数据、编程语言等热门技术领域
3. 适合技术博客平台（如CSDN）发布
4. 每个标题独立一行
5. 标题长度在10-30个字之间
6. 标题要体现技术深度和实用性
7. 不要包含序号，直接输出标题

请直接输出{count}个标题，每行一个："""
        
        try:
            response = self.client.chat.completions.create(
                model="glm-4-flash",  # 使用快速模型生成标题
                messages=[
                    {"role": "user", "content": prompt}
                ],
                temperature=0.8,  # 较高的温度以获得更有创意的标题
                max_tokens=2000
            )
            
            content = response.choices[0].message.content.strip()
            
            # 解析标题列表
            titles = []
            for line in content.split('\n'):
                line = line.strip()
                # 移除可能的序号（如 "1. ", "1、", "- " 等）
                line = line.lstrip('0123456789.、-》> ').strip()
                if line and len(line) >= 5:  # 过滤太短的行
                    titles.append(line)
            
            # 确保返回指定数量的标题
            if len(titles) < count:
                print(f"警告: 只生成了 {len(titles)} 个标题，少于请求的 {count} 个")
            
            return titles[:count]
            
        except Exception as e:
            print(f"生成标题时出错: {e}")
            raise
    
    def generate_article(self, title: str) -> str:
        """
        根据标题生成Markdown格式的文章
        
        Args:
            title: 文章标题
            
        Returns:
            Markdown格式的文章内容
        """
        prompt = f"""作为一名资深的技术博客作者，请根据标题"{title}"撰写一篇高质量的技术博客文章。

要求：
1. 使用Markdown格式撰写
2. 文章结构完整，包含：引言、主体内容（多个小节）、总结
3. 内容要专业、准确、有深度
4. 适当使用代码示例（如果适用）
5. 字数在1500-2500字之间
6. 使用二级标题（##）划分章节
7. 内容要有实用价值，能帮助读者解决实际问题
8. 语言简洁明了，逻辑清晰
9. 不要在开头重复标题
10. 文章内容要原创，避免抄袭

请直接输出Markdown格式的文章正文（不包含标题）："""
        
        try:
            response = self.client.chat.completions.create(
                model="glm-4-plus",  # 使用更强大的模型生成文章
                messages=[
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,  # 平衡创造性和准确性
                max_tokens=8000
            )
            
            content = response.choices[0].message.content.strip()
            
            # 清理可能的代码块标记（```markdown 或 ``` 包裹）
            content = self._clean_markdown_wrapper(content)
            
            # 构建完整的Markdown文章（包含标题）
            article = f"# {title}\n\n{content}"
            
            return article
            
        except Exception as e:
            print(f"生成文章时出错: {e}")
            raise
    
    def save_titles_to_todo(self, titles: List[str], todo_dir: Path = Path("todo")) -> Path:
        """
        将生成的标题保存到todo目录
        
        Args:
            titles: 标题列表
            todo_dir: todo目录路径
            
        Returns:
            保存的文件路径
        """
        # 确保todo目录存在
        todo_dir.mkdir(parents=True, exist_ok=True)
        
        # 使用当天日期作为文件名
        today = datetime.now().strftime("%Y%m%d")
        filename = f"{today}_titles.txt"
        filepath = todo_dir / filename
        
        # 保存标题
        with open(filepath, 'w', encoding='utf-8') as f:
            for i, title in enumerate(titles, 1):
                f.write(f"{i}. {title}\n")
        
        print(f"已将 {len(titles)} 个标题保存到: {filepath}")
        return filepath
    
    def save_article_to_posts(self, title: str, content: str, posts_dir: Path = Path("posts")) -> Path:
        """
        将生成的文章保存到posts目录
        
        Args:
            title: 文章标题（用作文件名）
            content: 文章内容（Markdown格式）
            posts_dir: posts目录路径
            
        Returns:
            保存的文件路径
        """
        # 确保posts目录存在
        posts_dir.mkdir(parents=True, exist_ok=True)
        
        # 清理标题作为文件名（移除特殊字符）
        safe_filename = self._sanitize_filename(title)
        filepath = posts_dir / f"{safe_filename}.md"
        
        # 如果文件已存在，添加时间戳
        if filepath.exists():
            timestamp = datetime.now().strftime("%H%M%S")
            filepath = posts_dir / f"{safe_filename}_{timestamp}.md"
        
        # 保存文章
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f"已保存文章到: {filepath}")
        return filepath
    
    @staticmethod
    def _clean_markdown_wrapper(content: str) -> str:
        """
        清理Markdown内容中的代码块包裹标记
        
        有时AI会返回被 ```markdown 或 ``` 包裹的内容，需要去掉这些标记
        
        Args:
            content: 原始内容
            
        Returns:
            清理后的内容
        """
        import re
        
        # 去除首尾空白
        content = content.strip()
        
        # 模式1: ```markdown ... ```
        # 模式2: ``` ... ```
        # 匹配开头的代码块标记（可能包含语言标识符）
        if content.startswith('```'):
            # 找到第一个换行符，移除第一行的 ```markdown 或 ```
            first_newline = content.find('\n')
            if first_newline != -1:
                content = content[first_newline + 1:]
            else:
                # 如果没有换行符，去掉开头的 ```
                content = content[3:].lstrip()
        
        # 移除结尾的 ```
        if content.endswith('```'):
            # 找到最后一个 ``` 之前的换行符
            content = content.rstrip('`').rstrip()
        
        # 更精确的正则表达式清理方式（作为备用）
        # 匹配 ```markdown\n内容\n``` 或 ```\n内容\n```
        pattern = r'^```(?:markdown|md|text)?\s*\n(.*?)\n```\s*$'
        match = re.match(pattern, content, re.DOTALL)
        if match:
            content = match.group(1)
        
        return content.strip()
    
    @staticmethod
    def _sanitize_filename(filename: str) -> str:
        """
        清理文件名，移除不安全的字符
        
        Args:
            filename: 原始文件名
            
        Returns:
            清理后的文件名
        """
        # 移除或替换不安全的字符
        unsafe_chars = '<>:"/\\|?*'
        for char in unsafe_chars:
            filename = filename.replace(char, '')
        
        # 移除首尾空格
        filename = filename.strip()
        
        # 限制长度（避免文件名过长）
        if len(filename) > 100:
            filename = filename[:100]
        
        return filename


def main():
    """
    命令行测试入口
    """
    import sys
    
    # 简单的命令行参数处理
    keyword = None
    if len(sys.argv) > 1:
        keyword = sys.argv[1]
    
    try:
        generator = ZhipuContentGenerator()
        
        # 生成标题
        print(f"正在生成标题{'（关键词: ' + keyword + '）' if keyword else '（基于最新技术趋势）'}...")
        titles = generator.generate_titles(keyword=keyword, count=10)
        
        print(f"\n成功生成 {len(titles)} 个标题：")
        for i, title in enumerate(titles, 1):
            print(f"{i}. {title}")
        
        # 保存标题到todo
        generator.save_titles_to_todo(titles)
        
        # 生成第一篇文章作为示例
        if titles:
            print(f"\n正在根据第一个标题生成示例文章...")
            article = generator.generate_article(titles[0])
            generator.save_article_to_posts(titles[0], article)
            print("\n示例文章已生成！")
        
    except Exception as e:
        print(f"错误: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
