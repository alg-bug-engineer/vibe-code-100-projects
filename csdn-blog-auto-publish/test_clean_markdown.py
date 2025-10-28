#!/usr/bin/env python3
"""
测试 _clean_markdown_wrapper 函数
"""

from zhipu_content_generator import ZhipuContentGenerator

# 测试用例
test_cases = [
    # 情况1: 被 ```markdown 包裹
    (
        "```markdown\n# 标题\n\n这是内容\n```",
        "# 标题\n\n这是内容"
    ),
    # 情况2: 被 ``` 包裹
    (
        "```\n# 标题\n\n这是内容\n```",
        "# 标题\n\n这是内容"
    ),
    # 情况3: 被 ```md 包裹
    (
        "```md\n# 标题\n\n这是内容\n```",
        "# 标题\n\n这是内容"
    ),
    # 情况4: 正常内容（不需要清理）
    (
        "# 标题\n\n这是内容",
        "# 标题\n\n这是内容"
    ),
    # 情况5: 内容中包含代码块（不应该被清理）
    (
        "```markdown\n# 标题\n\n代码示例：\n```python\nprint('hello')\n```\n\n继续内容\n```",
        "# 标题\n\n代码示例：\n```python\nprint('hello')\n```\n\n继续内容"
    ),
]

print("=" * 60)
print("测试 Markdown 包裹符号清理功能")
print("=" * 60)

passed = 0
failed = 0

for i, (input_text, expected_output) in enumerate(test_cases, 1):
    print(f"\n测试用例 {i}:")
    print(f"输入: {repr(input_text[:50])}...")
    
    result = ZhipuContentGenerator._clean_markdown_wrapper(input_text)
    
    if result == expected_output:
        print("✓ 通过")
        passed += 1
    else:
        print("✗ 失败")
        print(f"  期望: {repr(expected_output[:50])}...")
        print(f"  实际: {repr(result[:50])}...")
        failed += 1

print("\n" + "=" * 60)
print(f"测试结果: {passed} 通过, {failed} 失败")
print("=" * 60)
