#!/usr/bin/env python3
"""
测试智谱新闻搜索功能
"""

import os
from zhipu_news_search import ZhipuNewsSearcher


def test_basic_search():
    """测试基本搜索功能"""
    print("\n" + "="*70)
    print("测试 1: 基本新闻搜索")
    print("="*70)
    
    try:
        searcher = ZhipuNewsSearcher()
        print("✓ 搜索器初始化成功")
        
        # 测试搜索单个主题
        print("\n搜索主题: 大模型")
        news_items = searcher.search_tech_news(
            topics=["大模型"],
            days_back=1,
            max_results_per_topic=2
        )
        
        if news_items:
            print(f"✓ 找到 {len(news_items)} 条新闻")
            for i, news in enumerate(news_items, 1):
                print(f"\n新闻 {i}:")
                print(f"  主题: {news['topic']}")
                print(f"  标题: {news['title']}")
                print(f"  摘要: {news['summary'][:100]}...")
            return True
        else:
            print("✗ 未找到新闻")
            return False
            
    except Exception as e:
        print(f"✗ 测试失败: {e}")
        return False


def test_title_generation():
    """测试标题生成功能"""
    print("\n" + "="*70)
    print("测试 2: 标题生成和优化")
    print("="*70)
    
    try:
        searcher = ZhipuNewsSearcher()
        
        # 模拟新闻数据
        mock_news = [
            {
                'topic': '大模型',
                'title': 'GPT-5最新进展',
                'summary': 'OpenAI发布GPT-5，性能大幅提升',
                'source': 'Test',
                'date': '2025-10-27'
            },
            {
                'topic': '人工智能',
                'title': 'AI在医疗领域的应用',
                'summary': '人工智能技术在医疗诊断中取得突破',
                'source': 'Test',
                'date': '2025-10-27'
            }
        ]
        
        print(f"\n基于 {len(mock_news)} 条模拟新闻生成标题...")
        titles_info = searcher.generate_titles_from_news(mock_news, target_count=3)
        
        if titles_info:
            print(f"✓ 生成 {len(titles_info)} 个标题:")
            for i, info in enumerate(titles_info, 1):
                print(f"\n标题 {i}:")
                print(f"  {info['title']}")
                print(f"  主题: {info['topic']}")
            return True
        else:
            print("✗ 标题生成失败")
            return False
            
    except Exception as e:
        print(f"✗ 测试失败: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_file_operations():
    """测试文件保存功能"""
    print("\n" + "="*70)
    print("测试 3: 文件保存")
    print("="*70)
    
    try:
        from pathlib import Path
        searcher = ZhipuNewsSearcher()
        
        # 模拟数据
        mock_news = [{
            'topic': '测试',
            'title': '测试标题',
            'summary': '测试摘要',
            'source': 'Test',
            'date': '2025-10-27'
        }]
        
        mock_titles = [{
            'title': '测试文章标题',
            'summary': '测试摘要',
            'topic': '测试',
            'original_title': '原始标题'
        }]
        
        # 保存到临时目录
        test_dir = Path("test_output")
        test_dir.mkdir(exist_ok=True)
        
        print("\n保存新闻信息...")
        news_file = searcher.save_news_info(mock_news, test_dir)
        print(f"✓ 已保存: {news_file}")
        
        print("\n保存标题信息...")
        titles_file = searcher.save_titles_with_info(mock_titles, test_dir)
        print(f"✓ 已保存: {titles_file}")
        
        # 清理测试文件
        for f in test_dir.glob("*"):
            f.unlink()
        test_dir.rmdir()
        print("\n✓ 测试文件已清理")
        
        return True
        
    except Exception as e:
        print(f"✗ 测试失败: {e}")
        return False


def main():
    """运行所有测试"""
    print("\n" + "="*70)
    print("智谱新闻搜索功能测试")
    print("="*70)
    
    # 检查API Key
    if not os.environ.get("ZHIPUAI_API_KEY"):
        print("\n⚠️  警告: ZHIPUAI_API_KEY 未设置")
        print("某些测试将被跳过")
        print("\n设置方法: export ZHIPUAI_API_KEY='your-key'")
        has_api_key = False
    else:
        print("\n✓ API Key 已配置")
        has_api_key = True
    
    results = []
    
    # 运行测试
    if has_api_key:
        results.append(("基本搜索", test_basic_search()))
        results.append(("标题生成", test_title_generation()))
    else:
        print("\n跳过需要API的测试")
    
    results.append(("文件操作", test_file_operations()))
    
    # 打印结果
    print("\n" + "="*70)
    print("测试结果")
    print("="*70)
    
    passed = sum(1 for _, r in results if r)
    total = len(results)
    
    print(f"\n通过: {passed}/{total}")
    
    for name, result in results:
        status = "✓ 通过" if result else "✗ 失败"
        print(f"  {name}: {status}")
    
    print("\n" + "="*70)
    
    if passed == total:
        print("🎉 所有测试通过！")
    else:
        print("⚠️  部分测试失败")
    
    print("="*70 + "\n")
    
    return 0 if passed == total else 1


if __name__ == "__main__":
    import sys
    sys.exit(main())
