# CSDN Markdown 自动发布工具（Playwright）

把 `posts/` 目录中的 Markdown 批量发布到 CSDN 编辑器。支持保登录、自动填充标题与正文、自动点击发布按钮，并在弹窗中自动添加标签（默认“人工智能”）。

## 特性

- 批量处理 `posts/*.md`
- 自动提取标题（默认使用文件名）与正文（支持 YAML Front Matter，正文为 `content`）
- 登录状态持久化（`storage.json`）避免重复扫码
- 健壮的选择器与多重点击回退，尽量适配 CSDN 页面变化

## 目录

- `publish_csdn.py`：主脚本
- `posts/`：放置待发布的 Markdown 文件
- `storage.json`：Playwright 登录状态（首次登录后生成）
- `requirements.txt`：依赖清单

## 环境准备

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python -m playwright install
```

## 使用方法

1) 将待发布的 Markdown 放入 `posts/`

2) 首次运行需要在弹出的浏览器中完成登录（脚本默认等待 120 秒）

```bash
python publish_csdn.py --headless false
```

3) 后续再次运行将复用 `storage.json`，无需重复登录：

```bash
python publish_csdn.py
```

可选参数：

- `--headless [true|false]`：是否无头运行，默认 `false`
- `--login-timeout <seconds>`：等待登录超时时间，默认 `120`
- `--skip-publish`：只填充标题与正文，不点击发布（调试用）

## Markdown 要求与 Front Matter（可选）

- 文件名（不含扩展名）将作为默认标题
- 若文件包含 YAML Front Matter，将用其中的正文 `content` 作为发布内容
- 示例：

```markdown
---
title: 我的标题（可选）
tags: [人工智能, 量化]
---

这里是正文内容……
```

## 常见问题

- “打不开/点不到发布按钮”
	- 页面结构会变化，脚本内置了多种选择器和回退策略；若仍失败，手动发布或根据控制台提示调整选择器
- “每次都要登录”
	- 确认目录下已生成 `storage.json`；若文件损坏可删除后重新登录生成
- “中文输入异常 / 不能粘贴”
	- 脚本优先使用编辑器 API 与剪贴板回退；若依然失败，可手动粘贴或放宽浏览器权限

## 安全提示

- 请勿将真实账号信息、Cookie、Token 提交到公共仓库
- 如需长期复用登录，建议将 `storage.json` 加入 `.gitignore`

## 下一步

- 上传封面、分类/标签更丰富的配置
- 失败重试与发布结果校验
- CLI 交互与任务报告
