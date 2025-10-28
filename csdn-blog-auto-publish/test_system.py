#!/usr/bin/env python3
"""
测试脚本：验证所有功能是否正常工作
"""

import os
import sys
from pathlib import Path


def test_environment():
    """测试环境配置"""
    print("\n" + "="*70)
    print("测试 1：环境配置检查")
    print("="*70)
    
    # 检查Python版本
    import sys
    version = sys.version_info
    print(f"Python版本: {version.major}.{version.minor}.{version.micro}")
    
    if version.major < 3 or (version.major == 3 and version.minor < 8):
        print("❌ Python版本过低，需要3.8或更高版本")
        return False
    print("✓ Python版本符合要求")
    
    # 检查依赖包
    required_packages = [
        'playwright',
        'pyperclip',
        'frontmatter',
        'zhipuai'
    ]
    
    missing_packages = []
    for package in required_packages:
        try:
            __import__(package)
            print(f"✓ {package} 已安装")
        except ImportError:
            print(f"❌ {package} 未安装")
            missing_packages.append(package)
    
    if missing_packages:
        print(f"\n请安装缺失的包：pip install {' '.join(missing_packages)}")
        return False
    
    # 检查API Key
    api_key = os.environ.get("ZHIPUAI_API_KEY")
    if not api_key:
        print("⚠️  ZHIPUAI_API_KEY 未设置")
        print("   提示：export ZHIPUAI_API_KEY='your-api-key'")
        return False
    
    print(f"✓ ZHIPUAI_API_KEY 已设置（前10位: {api_key[:10]}...）")
    
    return True


def test_directory_structure():
    """测试目录结构"""
    print("\n" + "="*70)
    print("测试 2：目录结构检查")
    print("="*70)
    
    required_files = [
        'publish_csdn.py',
        'zhipu_content_generator.py',
        'auto_generate.py',
        'requirements.txt',
        'keywords.txt',
    ]
    
    required_dirs = [
        'posts',
        'todo',
    ]
    
    all_ok = True
    
    for file in required_files:
        path = Path(file)
        if path.exists():
            print(f"✓ {file} 存在")
        else:
            print(f"❌ {file} 不存在")
            all_ok = False
    
    for dir_name in required_dirs:
        path = Path(dir_name)
        if path.exists() and path.is_dir():
            print(f"✓ {dir_name}/ 目录存在")
        else:
            print(f"⚠️  {dir_name}/ 目录不存在（将自动创建）")
            path.mkdir(exist_ok=True)
    
    return all_ok


def test_zhipu_api():
    """测试智谱AI API连接"""
    print("\n" + "="*70)
    print("测试 3：智谱AI API连接")
    print("="*70)
    
    try:
        from zhipuai import ZhipuAI
        
        api_key = os.environ.get("ZHIPUAI_API_KEY")
        if not api_key:
            print("❌ ZHIPUAI_API_KEY 未设置，跳过API测试")
            return False
        
        print("正在测试API连接...")
        client = ZhipuAI(api_key=api_key)
        
        # 发送一个简单的测试请求
        response = client.chat.completions.create(
            model="glm-4-flash",
            messages=[
                {"role": "user", "content": "请用一句话回复：测试成功"}
            ],
            max_tokens=50
        )
        
        result = response.choices[0].message.content
        print(f"✓ API连接成功")
        print(f"  响应: {result}")
        return True
        
    except Exception as e:
        print(f"❌ API连接失败: {e}")
        return False


def test_content_generator():
    """测试内容生成器"""
    print("\n" + "="*70)
    print("测试 4：内容生成器功能")
    print("="*70)
    
    try:
        from zhipu_content_generator import ZhipuContentGenerator
        
        generator = ZhipuContentGenerator()
        print("✓ 内容生成器初始化成功")
        
        # 测试标题生成
        print("\n正在生成测试标题（2个）...")
        titles = generator.generate_titles(keyword="测试", count=2)
        
        if titles and len(titles) > 0:
            print(f"✓ 标题生成成功，共 {len(titles)} 个：")
            for i, title in enumerate(titles, 1):
                print(f"  {i}. {title}")
        else:
            print("❌ 标题生成失败")
            return False
        
        # 测试文件名清理
        test_filename = "测试<文件>名:带/特殊*字符"
        safe_name = generator._sanitize_filename(test_filename)
        print(f"\n✓ 文件名清理测试:")
        print(f"  原始: {test_filename}")
        print(f"  清理后: {safe_name}")
        
        return True
        
    except Exception as e:
        print(f"❌ 内容生成器测试失败: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_file_operations():
    """测试文件操作"""
    print("\n" + "="*70)
    print("测试 5：文件操作")
    print("="*70)
    
    try:
        from zhipu_content_generator import ZhipuContentGenerator
        
        generator = ZhipuContentGenerator()
        
        # 测试标题保存
        test_titles = ["测试标题1", "测试标题2", "测试标题3"]
        
        print("正在测试标题保存...")
        todo_file = generator.save_titles_to_todo(test_titles, Path("todo"))
        
        if todo_file.exists():
            print(f"✓ 标题保存成功: {todo_file}")
            
            # 读取验证
            with open(todo_file, 'r', encoding='utf-8') as f:
                content = f.read()
                print(f"  内容预览:\n{content[:100]}...")
        else:
            print("❌ 标题保存失败")
            return False
        
        # 测试文章保存
        print("\n正在测试文章保存...")
        test_article = "# 测试文章\n\n这是一篇测试文章。\n\n## 第一节\n\n内容..."
        
        posts_file = generator.save_article_to_posts(
            "测试文章标题",
            test_article,
            Path("posts")
        )
        
        if posts_file.exists():
            print(f"✓ 文章保存成功: {posts_file}")
            
            # 清理测试文件
            posts_file.unlink()
            print("  (测试文件已清理)")
        else:
            print("❌ 文章保存失败")
            return False
        
        return True
        
    except Exception as e:
        print(f"❌ 文件操作测试失败: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_scripts():
    """测试脚本语法"""
    print("\n" + "="*70)
    print("测试 6：脚本语法检查")
    print("="*70)
    
    scripts = [
        'publish_csdn.py',
        'zhipu_content_generator.py',
        'auto_generate.py',
        'demo.py',
    ]
    
    all_ok = True
    
    for script in scripts:
        try:
            with open(script, 'r', encoding='utf-8') as f:
                code = f.read()
                compile(code, script, 'exec')
            print(f"✓ {script} 语法正确")
        except SyntaxError as e:
            print(f"❌ {script} 语法错误: {e}")
            all_ok = False
        except FileNotFoundError:
            print(f"⚠️  {script} 文件不存在")
            all_ok = False
    
    return all_ok


def print_summary(results):
    """打印测试摘要"""
    print("\n" + "="*70)
    print("测试摘要")
    print("="*70)
    
    test_names = [
        "环境配置",
        "目录结构",
        "智谱AI API",
        "内容生成器",
        "文件操作",
        "脚本语法"
    ]
    
    passed = sum(results)
    total = len(results)
    
    print(f"\n通过: {passed}/{total}")
    
    for i, (name, result) in enumerate(zip(test_names, results), 1):
        status = "✓ 通过" if result else "❌ 失败"
        print(f"  {i}. {name}: {status}")
    
    print("\n" + "="*70)
    
    if passed == total:
        print("🎉 所有测试通过！系统已准备就绪。")
        print("\n下一步：")
        print("  1. 运行演示: python demo.py")
        print("  2. 生成内容: python auto_generate.py")
        print("  3. 发布文章: python publish_csdn.py")
    else:
        print("⚠️  部分测试失败，请检查配置。")
        print("\n常见问题：")
        print("  - 未安装依赖: pip install -r requirements.txt")
        print("  - 未设置API Key: export ZHIPUAI_API_KEY='your-key'")
        print("  - 浏览器未安装: python -m playwright install")
    
    print("="*70 + "\n")
    
    return passed == total


def main():
    """运行所有测试"""
    print("\n" + "="*70)
    print("CSDN自动发布系统 - 功能测试")
    print("="*70)
    
    results = []
    
    # 运行测试
    results.append(test_environment())
    results.append(test_directory_structure())
    results.append(test_zhipu_api())
    results.append(test_content_generator())
    results.append(test_file_operations())
    results.append(test_scripts())
    
    # 打印摘要
    all_passed = print_summary(results)
    
    sys.exit(0 if all_passed else 1)


if __name__ == "__main__":
    main()
