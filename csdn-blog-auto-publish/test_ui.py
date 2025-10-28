#!/usr/bin/env python3
"""
Web UI 快速测试脚本
测试UI是否可以正常启动
"""

import os
import sys

def test_ui_import():
    """测试UI模块导入"""
    print("=" * 60)
    print("测试 UI 模块导入")
    print("=" * 60)
    
    try:
        print("\n✓ 导入 gradio...")
        import gradio as gr
        print(f"  Gradio 版本: {gr.__version__}")
        
        print("\n✓ 导入 ui 模块...")
        import ui
        print("  UI 模块导入成功")
        
        print("\n✓ 检查 AppState...")
        state = ui.app_state
        print(f"  API Key 设置: {bool(state.api_key)}")
        
        print("\n✅ 所有导入测试通过！")
        return True
        
    except ImportError as e:
        print(f"\n❌ 导入失败: {e}")
        print("\n请确保已安装所有依赖:")
        print("  pip install gradio")
        return False
    except Exception as e:
        print(f"\n❌ 测试失败: {e}")
        return False

def test_ui_functions():
    """测试UI功能函数"""
    print("\n" + "=" * 60)
    print("测试 UI 功能函数")
    print("=" * 60)
    
    try:
        from ui import get_stats, format_stats_display, read_posts_list
        
        print("\n✓ 测试 get_stats()...")
        stats = get_stats()
        print(f"  posts_count: {stats['posts_count']}")
        print(f"  posts_limit: {stats['posts_limit']}")
        print(f"  titles_count: {stats['titles_count']}")
        print(f"  api_key_set: {stats['api_key_set']}")
        
        print("\n✓ 测试 format_stats_display()...")
        display = format_stats_display()
        print(f"  显示长度: {len(display)} 字符")
        
        print("\n✓ 测试 read_posts_list()...")
        posts = read_posts_list()
        print(f"  待发布文章: {len(posts)} 篇")
        
        print("\n✅ 所有功能测试通过！")
        return True
        
    except Exception as e:
        print(f"\n❌ 测试失败: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """主测试函数"""
    print("\n🚀 CSDN自动发布系统 - Web UI 测试")
    print("\n此测试将验证UI的基本功能，不会启动Web服务器\n")
    
    # 测试导入
    if not test_ui_import():
        print("\n⚠️  导入测试失败，请先解决依赖问题")
        return False
    
    # 测试功能
    if not test_ui_functions():
        print("\n⚠️  功能测试失败，请检查代码")
        return False
    
    # 总结
    print("\n" + "=" * 60)
    print("✅ 所有测试通过！")
    print("=" * 60)
    print("\n现在可以启动Web界面：")
    print("  python ui.py")
    print("\n或使用启动脚本：")
    print("  ./start.sh")
    print("  选择选项 1: 启动Web界面")
    print("\n界面将在浏览器中自动打开: http://localhost:7860")
    print("=" * 60)
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
