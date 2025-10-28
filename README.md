# Vibe Coding · 100 个小工具计划

用 Vibe Coding 的方式，一口气做 100 个实用小工具/小项目。形态不限：有命令行脚本、自动化机器人、也有纯前端网页，未来还会打包成可分发的桌面应用（exe/app）。

当前进度（2025-10-24）：3 / 100

- CSDN 博客自动发布（Python + Playwright）
- 小红书自动浏览/点赞/收藏（Python + Playwright）
- 儿童英语图片发音卡片（纯前端 Web App）

## 项目总览

| 序号 | 项目 | 目录 | 类型 | 简介 |
| --- | --- | --- | --- | --- |
| 01 | CSDN 博客自动发布 | `csdn-blog-auto-publish/` | Python 脚本 | 批量把 `posts/` 里的 Markdown 发布到 CSDN，支持保登录、自动填充、自动发布 |
| 02 | 小红书自动浏览/点赞/收藏 | `xhs/` | Python 脚本 | 登录后自动在探索页逐条浏览、点赞、收藏并记录日志 |
| 03 | 儿童英语卡片（发音） | `flashcard-app/` | Web 应用 | 网格卡片展示单词图片，点击播放发音，支持分类筛选 |

更多项目将持续补充，目标是覆盖日常效率、内容创作、数据处理、学习工具等多个方向。

## 目录结构

```
csdn-blog-auto-publish/
  ├─ publish_csdn.py          # 主脚本：把 posts/ 下的 Markdown 发布到 CSDN
  ├─ posts/                   # 本地 Markdown 博文
  ├─ storage.json             # 登录状态（Playwright storage state）
  ├─ requirements.txt         # 依赖
  └─ README.md

flashcard-app/
  ├─ index.html               # 单页应用入口
  ├─ data.js                  # 卡片数据（图片/音频/分类）
  ├─ script.js                # 逻辑：渲染网格、播放音频、分类筛选
  ├─ style.css                # 样式
  ├─ images/                  # 图片资源
  └─ audio/                   # 音频资源

xhs/
  ├─ xhs.py                   # 自动浏览/点赞/收藏脚本
  ├─ xiaohongshu_auth.json    # 登录状态（Playwright storage state）
  └─ logs/                    # 运行日志与中间快照
```

> 小贴士：请勿将真实账号凭据、Cookie、Token 等敏感信息提交到公开仓库。建议只保留示例文件，真实文件放到本地或私有密钥管理中。

## 快速开始

按项目进入对应子目录，参考各自的 README：

- Python 自动化脚本（如 CSDN、小红书）：
  1) 准备虚拟环境并安装依赖；2) 首次运行时完成浏览器内登录；3) 开始自动化。
  
  示例（macOS / zsh）：
  ```bash
  python3 -m venv .venv
  source .venv/bin/activate
  pip install -r requirements.txt
  python -m playwright install
  ```

- 纯前端 Web 应用（如儿童英语卡片）：
  1) 直接用浏览器打开 `index.html`；或
  2) 启动本地静态服务器后访问。
  
  示例（任意目录运行小型 http 服务）：
  ```bash
  python3 -m http.server 8000
  # 浏览器打开 http://localhost:8000/flashcard-app/
  ```

## 贡献与协作

- 每个子项目保持“可独立运行、5 分钟上手”的目标：清晰 README、最小依赖、可复制的步骤。
- 欢迎以「一个具体问题 + 一个最小可行工具」的方式贡献新的小项目。
- 命名建议：`<领域>-<动词>-<目标>`，例如 `youtube-caption-downloader`。

## 许可证

MIT（见根目录 `LICENSE`）。若子项目使用不同许可证，会在各自目录单独声明。

## 清单与进度

- [x] 01 CSDN 博客自动发布
- [x] 02 小红书自动浏览/点赞/收藏
- [x] 03 儿童英语卡片（发音）
- [ ] 04~100 待定（持续更新）

—— Keep vibing, keep shipping.
