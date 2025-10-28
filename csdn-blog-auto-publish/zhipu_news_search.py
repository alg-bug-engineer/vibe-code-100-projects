#!/usr/bin/env python3
"""
zhipu_news_search.py

基于智谱AI Web Search API自动搜索技术新闻并生成文章
"""

import os
import json
from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Dict, Optional
from zhipuai import ZhipuAI


class ZhipuNewsSearcher:
    """智谱AI新闻搜索器"""
    
    # 预定义的技术领域关键词
    DEFAULT_TOPICS = [
        "大模型",
        "人工智能",
        "智能体",
        "AI技术",
        "强化学习",
        "文生视频",
        "机器学习",
        "深度学习",
        "自然语言处理",
        "计算机视觉",
        "生成式AI",
        "GPT",
        "Transformer",
        "多模态AI",
        "AI应用"
    ]
    
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
    
    def search_tech_news(
        self, 
        topics: Optional[List[str]] = None, 
        days_back: int = 1,
        max_results_per_topic: int = 3
    ) -> List[Dict[str, str]]:
        """
        搜索技术新闻
        
        Args:
            topics: 要搜索的主题列表，如果为None则使用默认主题
            days_back: 搜索最近几天的新闻，默认1天（昨天）
            max_results_per_topic: 每个主题最多返回的结果数
            
        Returns:
            新闻信息列表，每个元素包含 {topic, title, summary, source, date}
        """
        if topics is None:
            topics = self.DEFAULT_TOPICS[:5]  # 默认使用前5个主题
        
        # 计算日期范围
        today = datetime.now()
        start_date = today - timedelta(days=days_back)
        date_str = start_date.strftime("%Y年%m月%d日")
        
        all_news = []
        
        print(f"\n{'='*70}")
        print(f"搜索 {date_str} 以来的技术新闻...")
        print(f"主题: {', '.join(topics)}")
        print(f"{'='*70}\n")
        
        for topic in topics:
            print(f"正在搜索主题: {topic}...")
            
            try:
                news_items = self._search_single_topic(
                    topic, 
                    date_str, 
                    max_results_per_topic
                )
                all_news.extend(news_items)
                print(f"  ✓ 找到 {len(news_items)} 条相关新闻")
                
            except Exception as e:
                print(f"  ✗ 搜索失败: {e}")
                continue
        
        print(f"\n总计找到 {len(all_news)} 条新闻\n")
        return all_news
    
    def _search_single_topic(
        self, 
        topic: str, 
        date_str: str, 
        max_results: int
    ) -> List[Dict[str, str]]:
        """
        搜索单个主题的新闻
        
        Args:
            topic: 主题关键词
            date_str: 日期字符串
            max_results: 最大结果数
            
        Returns:
            新闻信息列表
        """
        # 构建搜索工具配置
        tools = [{
            "type": "web_search",
            "web_search": {
                "enable": True,
                "search_result": True
            }
        }]
        
        # 构建搜索查询
        query = f"{date_str}以来关于{topic}的最新技术动态、突破和应用案例"
        
        messages = [{
            "role": "user",
            "content": query
        }]
        
        try:
            # 调用API
            response = self.client.chat.completions.create(
                model="glm-4-flash",  # 使用快速模型进行搜索
                messages=messages,
                tools=tools,
                temperature=0.3  # 较低温度保证准确性
            )
            
            # 解析响应
            content = response.choices[0].message.content
            
            # 提取新闻信息
            news_items = self._parse_search_results(content, topic, max_results)
            
            return news_items
            
        except Exception as e:
            print(f"搜索主题 '{topic}' 时出错: {e}")
            return []
    
    def _parse_search_results(
        self, 
        content: str, 
        topic: str, 
        max_results: int
    ) -> List[Dict[str, str]]:
        """
        解析搜索结果，提取关键信息
        
        Args:
            content: API返回的内容
            topic: 主题
            max_results: 最大结果数
            
        Returns:
            新闻信息列表
        """
        # 使用AI提取结构化信息
        prompt = f"""请从以下搜索结果中提取最重要的{max_results}条技术新闻信息。

搜索结果：
{content}

要求：
1. 每条新闻包含：标题、简要摘要（50-100字）
2. 标题要简洁、吸引人，适合作为技术博客标题
3. 摘要要突出技术亮点和创新点
4. 按重要性排序
5. 输出JSON格式：[{{"title": "标题", "summary": "摘要"}}]

请直接输出JSON数组，不要其他内容："""
        
        try:
            response = self.client.chat.completions.create(
                model="glm-4-flash",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1  # 非常低的温度保证输出格式稳定
            )
            
            result_text = response.choices[0].message.content.strip()
            
            # 清理可能的代码块标记
            if result_text.startswith('```'):
                result_text = result_text.split('\n', 1)[1]
            if result_text.endswith('```'):
                result_text = result_text.rsplit('\n', 1)[0]
            result_text = result_text.replace('```json', '').replace('```', '').strip()
            
            # 解析JSON
            news_list = json.loads(result_text)
            
            # 添加主题和日期信息
            news_items = []
            for item in news_list[:max_results]:
                news_items.append({
                    'topic': topic,
                    'title': item.get('title', ''),
                    'summary': item.get('summary', ''),
                    'source': 'Web Search',
                    'date': datetime.now().strftime("%Y-%m-%d")
                })
            
            return news_items
            
        except json.JSONDecodeError as e:
            print(f"  警告: JSON解析失败，尝试手动提取信息")
            # 降级处理：直接使用内容作为摘要
            return [{
                'topic': topic,
                'title': f"{topic}最新技术动态",
                'summary': content[:200] if len(content) > 200 else content,
                'source': 'Web Search',
                'date': datetime.now().strftime("%Y-%m-%d")
            }]
        except Exception as e:
            print(f"  警告: 解析搜索结果失败: {e}")
            return []
    
    def generate_titles_from_news(
        self, 
        news_items: List[Dict[str, str]], 
        target_count: int = 15
    ) -> List[Dict[str, str]]:
        """
        基于新闻生成文章标题
        
        Args:
            news_items: 新闻信息列表
            target_count: 目标生成数量
            
        Returns:
            标题信息列表，包含 {title, summary, topic}
        """
        if not news_items:
            print("没有新闻信息可用于生成标题")
            return []
        
        # 如果新闻数量不足，需要扩展
        if len(news_items) < target_count:
            print(f"\n新闻数量 ({len(news_items)}) 少于目标数量 ({target_count})，将基于现有新闻扩展...")
            news_items = self._expand_news_items(news_items, target_count)
        
        # 选取前N条新闻
        selected_news = news_items[:target_count]
        
        print(f"\n{'='*70}")
        print(f"基于 {len(selected_news)} 条新闻生成文章标题...")
        print(f"{'='*70}\n")
        
        titles_with_info = []
        
        for i, news in enumerate(selected_news, 1):
            print(f"[{i}/{len(selected_news)}] 处理: {news['topic']}")
            
            try:
                # 优化标题
                optimized_title = self._optimize_title(news['title'], news['summary'])
                
                titles_with_info.append({
                    'title': optimized_title,
                    'summary': news['summary'],
                    'topic': news['topic'],
                    'original_title': news['title']
                })
                
                print(f"  ✓ 标题: {optimized_title}")
                
            except Exception as e:
                print(f"  ✗ 失败: {e}")
                # 使用原标题作为备选
                titles_with_info.append({
                    'title': news['title'],
                    'summary': news['summary'],
                    'topic': news['topic'],
                    'original_title': news['title']
                })
        
        return titles_with_info
    
    def _expand_news_items(
        self, 
        news_items: List[Dict[str, str]], 
        target_count: int
    ) -> List[Dict[str, str]]:
        """
        扩展新闻列表到目标数量
        
        通过对现有新闻进行变体和扩展来增加数量
        """
        expanded = list(news_items)  # 复制原列表
        
        while len(expanded) < target_count and news_items:
            for news in news_items:
                if len(expanded) >= target_count:
                    break
                
                # 创建变体
                variant = {
                    'topic': news['topic'],
                    'title': f"{news['topic']}深度解析：{news['title'].split('：')[-1] if '：' in news['title'] else news['title']}",
                    'summary': news['summary'],
                    'source': news['source'],
                    'date': news['date']
                }
                expanded.append(variant)
        
        return expanded[:target_count]
    
    def _optimize_title(self, title: str, summary: str) -> str:
        """
        优化标题，使其更适合技术博客
        
        Args:
            title: 原始标题
            summary: 新闻摘要
            
        Returns:
            优化后的标题
        """
        prompt = f"""请将以下技术新闻标题优化为更吸引人的技术博客标题。

原标题: {title}
摘要: {summary}

要求：
1. 标题长度15-35个字
2. 突出技术亮点和创新性
3. 适合CSDN等技术博客平台
4. 专业且有吸引力
5. 包含关键技术词汇
6. 不要使用标点符号作为结尾
7. 直接输出优化后的标题，不要其他内容

优化后的标题："""
        
        try:
            response = self.client.chat.completions.create(
                model="glm-4-flash",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
                max_tokens=100
            )
            
            optimized = response.choices[0].message.content.strip()
            # 移除可能的引号
            optimized = optimized.strip('"\'""''')
            
            return optimized if optimized else title
            
        except Exception as e:
            print(f"    警告: 标题优化失败，使用原标题: {e}")
            return title
    
    def save_news_info(
        self, 
        news_items: List[Dict[str, str]], 
        output_dir: Path = Path("todo")
    ) -> Path:
        """
        保存新闻信息到JSON文件
        
        Args:
            news_items: 新闻信息列表
            output_dir: 输出目录
            
        Returns:
            保存的文件路径
        """
        output_dir.mkdir(parents=True, exist_ok=True)
        
        today = datetime.now().strftime("%Y%m%d")
        filename = f"{today}_news.json"
        filepath = output_dir / filename
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(news_items, f, ensure_ascii=False, indent=2)
        
        print(f"\n新闻信息已保存到: {filepath}")
        return filepath
    
    def save_titles_with_info(
        self, 
        titles_info: List[Dict[str, str]], 
        output_dir: Path = Path("todo")
    ) -> Path:
        """
        保存标题和相关信息
        
        Args:
            titles_info: 标题信息列表
            output_dir: 输出目录
            
        Returns:
            保存的文件路径
        """
        output_dir.mkdir(parents=True, exist_ok=True)
        
        today = datetime.now().strftime("%Y%m%d")
        
        # 保存为JSON（包含完整信息）
        json_file = output_dir / f"{today}_titles_info.json"
        with open(json_file, 'w', encoding='utf-8') as f:
            json.dump(titles_info, f, ensure_ascii=False, indent=2)
        
        # 保存为TXT（仅标题列表，兼容现有系统）
        txt_file = output_dir / f"{today}_titles.txt"
        with open(txt_file, 'w', encoding='utf-8') as f:
            for i, item in enumerate(titles_info, 1):
                f.write(f"{i}. {item['title']}\n")
        
        print(f"\n标题信息已保存:")
        print(f"  - JSON: {json_file}")
        print(f"  - TXT:  {txt_file}")
        
        return json_file


def main():
    """
    命令行测试入口
    """
    import argparse
    
    parser = argparse.ArgumentParser(description="基于智谱AI搜索技术新闻并生成文章标题")
    parser.add_argument(
        "--topics",
        nargs="+",
        default=None,
        help="指定搜索主题（空格分隔），不指定则使用默认主题"
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
        help="生成标题数量（默认15个）"
    )
    
    args = parser.parse_args()
    
    try:
        searcher = ZhipuNewsSearcher()
        
        # 搜索新闻
        news_items = searcher.search_tech_news(
            topics=args.topics,
            days_back=args.days,
            max_results_per_topic=3
        )
        
        if not news_items:
            print("未找到相关新闻")
            return
        
        # 保存新闻信息
        searcher.save_news_info(news_items)
        
        # 生成标题
        titles_info = searcher.generate_titles_from_news(news_items, args.count)
        
        # 保存标题
        searcher.save_titles_with_info(titles_info)
        
        print(f"\n{'='*70}")
        print(f"完成！生成了 {len(titles_info)} 个标题")
        print(f"{'='*70}\n")
        
    except Exception as e:
        print(f"错误: {e}")
        import traceback
        traceback.print_exc()
        return 1
    
    return 0


if __name__ == "__main__":
    import sys
    sys.exit(main())
