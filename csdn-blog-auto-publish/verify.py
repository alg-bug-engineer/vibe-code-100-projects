#!/usr/bin/env python3
"""
快速验证脚本 - 确保所有功能正常工作
"""

import os
import sys
from pathlib import Path


def check_files():
    """检查所有必需的文件"""
    print("\n" + "="*60)
    print("检查文件完整性...")
    print("="*60)
    
    required_files = {
        '核心模块': [
            'zhipu_content_generator.py',
            'auto_generate.py',
            'publish_csdn.py',
        ],
        '工具脚本': [
            'demo.py',
            'test_system.py',
            'start.sh',
        ],
        '配置文件': [
            'requirements.txt',
            'keywords.txt',
            '.env.example',
            '.gitignore',
        ],
        '文档': [
            'README_NEW.md',
            'QUICKSTART.md',
            'PROJECT_OVERVIEW.md',
            'INSTALLATION_COMPLETE.md',
            'OPTIMIZATION_SUMMARY.md',
        ]
    }
    
    all_ok = True
    for category, files in required_files.items():
        print(f"\n{category}:")
        for file in files:
            path = Path(file)
            if path.exists():
                size = path.stat().st_size
                print(f"  ✓ {file} ({size} bytes)")
            else:
                print(f"  ✗ {file} 不存在")
                all_ok = False
    
    return all_ok


def check_directories():
    """检查目录结构"""
    print("\n" + "="*60)
    print("检查目录结构...")
    print("="*60)
    
    dirs = ['posts', 'todo']
    
    for dir_name in dirs:
        path = Path(dir_name)
        if path.exists() and path.is_dir():
            count = len(list(path.glob('*')))
            print(f"  ✓ {dir_name}/ 存在 ({count} 个文件)")
        else:
            print(f"  ! {dir_name}/ 不存在（将在使用时自动创建）")


def check_python_syntax():
    """检查Python文件语法"""
    print("\n" + "="*60)
    print("检查Python语法...")
    print("="*60)
    
    python_files = [
        'zhipu_content_generator.py',
        'auto_generate.py',
        'publish_csdn.py',
        'demo.py',
        'test_system.py',
    ]
    
    all_ok = True
    for file in python_files:
        try:
            with open(file, 'r', encoding='utf-8') as f:
                code = f.read()
                compile(code, file, 'exec')
            print(f"  ✓ {file}")
        except SyntaxError as e:
            print(f"  ✗ {file}: {e}")
            all_ok = False
        except FileNotFoundError:
            print(f"  ✗ {file} 不存在")
            all_ok = False
    
    return all_ok


def check_dependencies():
    """检查依赖包"""
    print("\n" + "="*60)
    print("检查依赖包...")
    print("="*60)
    
    packages = {
        'playwright': 'playwright',
        'pyperclip': 'pyperclip',
        'frontmatter': 'frontmatter',
        'zhipuai': 'zhipuai',
    }
    
    missing = []
    for display_name, import_name in packages.items():
        try:
            __import__(import_name)
            print(f"  ✓ {display_name}")
        except ImportError:
            print(f"  ✗ {display_name} 未安装")
            missing.append(display_name)
    
    if missing:
        print(f"\n  安装命令: pip install {' '.join(missing)}")
        return False
    
    return True


def check_api_key():
    """检查API Key配置"""
    print("\n" + "="*60)
    print("检查API Key配置...")
    print("="*60)
    
    api_key = os.environ.get("ZHIPUAI_API_KEY")
    if api_key:
        print(f"  ✓ ZHIPUAI_API_KEY 已设置")
        print(f"    前10位: {api_key[:10]}...")
        return True
    else:
        print("  ✗ ZHIPUAI_API_KEY 未设置")
        print("\n  设置方法:")
        print("    export ZHIPUAI_API_KEY='your-api-key'")
        return False


def print_next_steps(all_checks_passed):
    """打印下一步操作"""
    print("\n" + "="*60)
    print("验证结果")
    print("="*60)
    
    if all_checks_passed:
        print("\n✅ 所有检查通过！系统已准备就绪。\n")
        print("下一步操作：\n")
        print("1️⃣  快速开始：")
        print("   ./start.sh\n")
        print("2️⃣  运行演示：")
        print("   python demo.py\n")
        print("3️⃣  生成内容：")
        print("   python auto_generate.py --generate-articles 3\n")
        print("4️⃣  发布到CSDN：")
        print("   python publish_csdn.py --headless false\n")
        print("5️⃣  查看文档：")
        print("   cat QUICKSTART.md\n")
    else:
        print("\n⚠️  部分检查未通过，请根据上述提示进行修复。\n")
        print("常见解决方案：\n")
        print("1️⃣  安装依赖：")
        print("   pip install -r requirements.txt")
        print("   python -m playwright install\n")
        print("2️⃣  设置API Key：")
        print("   export ZHIPUAI_API_KEY='your-api-key'\n")
        print("3️⃣  创建目录：")
        print("   mkdir -p posts todo\n")
    
    print("="*60 + "\n")


def main():
    """主函数"""
    print("\n" + "="*60)
    print("CSDN自动发布系统 - 快速验证")
    print("="*60)
    
    checks = []
    
    # 运行所有检查
    checks.append(check_files())
    check_directories()
    checks.append(check_python_syntax())
    checks.append(check_dependencies())
    checks.append(check_api_key())
    
    # 所有必需检查都通过
    all_passed = all(checks)
    
    # 打印结果和下一步
    print_next_steps(all_passed)
    
    sys.exit(0 if all_passed else 1)


if __name__ == "__main__":
    main()
