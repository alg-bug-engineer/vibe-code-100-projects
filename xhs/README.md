# 小红书自动浏览/点赞/收藏（Playwright）

登录一次后，自动在探索页依次打开帖子、停留、点赞、收藏并关闭，循环处理多条内容，同时把中间快照与日志保存到 `logs/`，便于排查。

## 功能

- 支持扫码登录后持久化登录状态（`xiaohongshu_auth.json`）
- 在探索页自动：打开帖子 → 停留若干秒 → 点赞 → 收藏 → 关闭 → 下一条
- 多重点击策略（Hover+Click / Force Click / JS Click）提升稳定性
- 发生异常时自动截图保存到 `logs/`

## 环境准备

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install playwright
python -m playwright install
```

（可选）如果你有统一依赖清单，可把 `playwright` 写进项目级 requirements.txt。

## 使用方法

```bash
python xhs.py
```

首次运行会打开浏览器：
- 在登录弹窗中完成扫码登录；
- 成功后脚本会保存 `xiaohongshu_auth.json`，下次可直接复用，无需重复扫码。

默认行为：
- 浏览并互动最多 8 条（可在 `browse_and_engage(page, max_items=8, ...)` 调整）
- 详情页停留 4 秒（可在 `wait_seconds` 调整）

## 目录

- `xhs.py`：主脚本
- `xiaohongshu_auth.json`：登录状态（首次成功登录后自动生成）
- `logs/`：运行日志、截图与中间 DOM

## 常见问题

- “扫码后还是显示未登录？”
  - 等待几秒让页面刷新；若依旧失败，删除 `xiaohongshu_auth.json` 重新运行并扫码
- “点击不到点赞/收藏按钮”
  - 页面结构可能变化，脚本内含多种选择器与回退；如仍失败，可根据报错在 DevTools 中校准选择器
- “运行很慢/触发风控”
  - 适当调大 `wait_seconds` 或减少 `max_items`；保持人工使用节奏

## 合规与安全

- 请遵守目标平台的用户协议与使用规范，请勿用于刷量或破坏性行为
- 不要把 `xiaohongshu_auth.json` 上传到公共仓库；建议加入 `.gitignore`
