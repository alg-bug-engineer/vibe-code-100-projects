# 知乎文章自动发布工具

一个基于 Playwright 的知乎专栏文章自动发布脚本,支持批量发布 Markdown 文件,并具有完善的反检测机制。

## 功能特点

✅ **批量发布** - 自动读取 `posts` 目录下的所有 Markdown 文件并发布  
✅ **反检测优化** - 模拟真实人类行为,降低被知乎检测的风险  
✅ **发布记录** - 自动记录已发布文章,避免重复发布  
✅ **智能间隔** - 每篇文章发布间隔 5-10 分钟,模拟人类操作  
✅ **错误处理** - 失败自动跳过,不影响后续文章发布  

## 反检测机制

1. **浏览器指纹伪装**
   - 禁用 `AutomationControlled` 特征
   - 覆盖 `navigator.webdriver` 属性
   - 设置真实的 User-Agent 和浏览器环境

2. **模拟人类行为**
   - 逐字输入标题和正文 (每字符延迟 50-150ms)
   - 随机延迟和等待时间
   - 鼠标悬停后再点击按钮
   - 随机滚动页面检查内容

3. **发布间隔控制**
   - 每篇文章间隔 5-10 分钟 (可配置)
   - 出错后等待 1-2 分钟再继续

## 安装依赖

```bash
pip install playwright
playwright install chromium
```

## 使用方法

### 1. 准备 Markdown 文件

将要发布的文章放入 `posts` 目录:

```
zhihu-blog-auto/
├── posts/
│   ├── 文章标题1.md
│   ├── 文章标题2.md
│   └── 文章标题3.md
└── zhihu_publish.py
```

**注意**: 文件名(去掉 .md 后缀)将作为文章标题

### 2. 首次运行 - 登录知乎

```bash
python zhihu_publish.py
```

首次运行时,脚本会:
1. 打开浏览器
2. 提示你手动登录知乎(扫码或账号密码)
3. 登录成功后,在 Playwright 检查器窗口点击 "Resume" 按钮
4. 脚本会保存登录状态到 `zhihu_state.json`

### 3. 后续运行 - 自动发布

再次运行时,脚本会:
1. 自动加载登录状态
2. 扫描 `posts` 目录下的未发布文章
3. 逐个发布文章,每篇间隔 5-10 分钟
4. 记录发布结果到 `publish_log.json`

## 配置选项

在 `zhihu_publish.py` 中可以调整以下参数:

```python
# 发布间隔配置 (秒)
MIN_INTERVAL = 300  # 最小间隔 5 分钟
MAX_INTERVAL = 600  # 最大间隔 10 分钟

# 文件路径
POSTS_DIR = 'posts'  # markdown 文件目录
PUBLISH_LOG_FILE = 'publish_log.json'  # 发布记录
STATE_FILE_PATH = 'zhihu_state.json'  # 登录状态
```

## 文件说明

- `zhihu_publish.py` - 主程序脚本
- `posts/` - 存放待发布的 Markdown 文件
- `zhihu_state.json` - 知乎登录状态 (自动生成)
- `publish_log.json` - 发布记录日志 (自动生成)
- `error_screenshot.png` - 出错时的截图 (调试用)

## 发布日志格式

`publish_log.json` 示例:

```json
{
  "文章标题1.md": {
    "published": true,
    "url": "https://zhuanlan.zhihu.com/p/123456789",
    "timestamp": "2025-10-24T10:30:00.123456",
    "title": "文章标题1"
  },
  "文章标题2.md": {
    "published": false,
    "error": "发布失败原因",
    "timestamp": "2025-10-24T10:45:00.123456",
    "title": "文章标题2"
  }
}
```

## 注意事项

⚠️ **避免频繁发布**
- 建议每天发布文章不超过 3-5 篇
- 不要在短时间内大量发布,容易触发知乎限制

⚠️ **保管好登录状态文件**
- `zhihu_state.json` 包含登录凭据,不要泄露
- 建议添加到 `.gitignore`

⚠️ **定期更新选择器**
- 知乎页面可能更新,导致选择器失效
- 如果脚本失败,检查并更新 Playwright 选择器

⚠️ **遵守平台规则**
- 本工具仅供学习研究使用
- 请遵守知乎社区规范,不要发布违规内容

## 故障排除

### 1. 登录状态失效

删除 `zhihu_state.json`,重新运行脚本登录

### 2. 选择器找不到

知乎页面可能更新,需要更新脚本中的选择器:
- `TITLE_SELECTOR` - 标题输入框
- `BODY_SELECTOR` - 内容输入框
- `PUBLISH_BUTTON_SELECTOR` - 发布按钮
- `MODAL_CONFIRM_SELECTOR` - 确认发布按钮

### 3. 被知乎检测

- 增加 `MIN_INTERVAL` 和 `MAX_INTERVAL` 的值
- 减少每天发布的文章数量
- 手动登录一次,重新生成登录状态

## License

MIT
