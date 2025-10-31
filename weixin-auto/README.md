# 微信公众号自动化工具

基于 Python Playwright 开发的微信公众号自动化工具，支持自动登录、写作、发表等功能。

## 功能特性

- ✅ **自动登录**: 支持二维码登录，自动保存和恢复登录状态
- ✅ **Markdown 转换**: 自动将本地 Markdown 文件转换为富文本格式
- ✅ **格式保留**: 完美保留 Markdown 的样式、代码块、图片等
- ✅ **文章写作**: 自动填写标题、内容、作者等信息
- ✅ **草稿保存**: 自动保存文章草稿
- ✅ **批量处理**: 支持批量处理多个 Markdown 文件
- ✅ **自定义工作流**: 灵活的 API 设计，支持自定义操作流程

## 环境要求

- Python 3.7+
- macOS / Windows / Linux
- Chrome/Chromium 浏览器

## 安装步骤

### 1. 克隆项目
```bash
git clone <项目地址>
cd weixin-auto
```

### 2. 安装 Python 依赖
```bash
pip install -r requirements.txt
```

### 3. 安装 Playwright 浏览器
```bash
playwright install chromium
```

## 快速开始

### 方式一：Markdown 文件自动发布（推荐）

这是最简单的使用方式，适合从 Markdown 文件发布文章。

**步骤：**

1. 在 `posts` 文件夹中放置你的 Markdown 文件：
```bash
posts/
  └── my-article.md
```

2. 运行脚本：
```bash
python markdown_to_wechat.py
```

3. 扫码登录微信公众号，剩下的全自动完成！

**🚀 批量处理流程：**
- ✅ **批量读取** posts/ 目录下所有 Markdown 文件
- ✅ **格式转换** 使用 [md.doocs.org](https://md.doocs.org/) 转换为富文本格式
- ✅ **一次登录** 只需扫码登录一次，处理所有文章
- ✅ **逐篇处理** 自动创建新文章、填写内容、保存草稿
- ✅ **自动归档** 处理完成的文件自动移动到 done/ 目录
- ✅ **进度提示** 显示处理进度和结果统计

**📊 批量处理示例：**
```
🚀 准备批量处理 4 个文件:
  1. python-automation-guide.md
  2. playwright-vs-selenium.md  
  3. wechat-automation-practice.md
  4. test-article.md

📋 处理计划:
  • 登录微信公众号后台
  • 逐个转换并发布 4 篇文章
  • 自动保存为草稿
  • 处理完成的文件移动到 done/ 目录

✅ 成功处理: 4 篇
📁 处理完成的文件已移动到 done/ 目录
```

### 方式二：基础自动化脚本

适合简单的文本内容发布。

**运行：**
```bash
python wechat_mp_automation.py
```

**自定义配置：**
```python
# 在 wechat_mp_automation.py 的 main() 函数中修改
article_title = "你的文章标题"
article_content = "你的文章内容"
article_author = "你的名字"
```

## 项目文件说明

```
weixin-auto/
├── markdown_to_wechat.py      # ⭐ Markdown 批量发布脚本（推荐）
├── wechat_mp_automation.py    # 基础自动化脚本
├── posts/                      # 📝 Markdown 文件存放目录
│   ├── python-automation-guide.md
│   ├── playwright-vs-selenium.md
│   ├── wechat-automation-practice.md
│   └── test-article.md
├── done/                       # 📁 已处理文件归档目录（自动创建）
├── requirements.txt           # Python 依赖
├── README.md                  # 项目说明
├── QUICKSTART.md             # 快速上手指南
└── .gitignore                # Git 忽略配置
```

## Markdown 文件示例

在 `posts` 文件夹中创建 `.md` 文件，支持完整的 Markdown 语法：

```markdown
# 文章标题

> 这是引用文字

## 章节标题

这是正文内容，支持 **粗体**、*斜体*、`代码` 等格式。

### 代码块

\`\`\`python
def hello():
    print("Hello, World!")
\`\`\`

### 图片

![图片描述](图片URL)

### 列表

1. 有序列表项 1
2. 有序列表项 2

- 无序列表项 1
- 无序列表项 2
```

## 详细使用说明

### Markdown 转换流程详解

`markdown_to_wechat.py` 脚本的工作流程：

1. **读取文件**: 从 `posts/` 目录读取 `.md` 文件
2. **在线转换**: 访问 https://md.doocs.org/ 进行格式转换
3. **自动复制**: 点击"复制"按钮，获取带格式的内容
4. **登录公众号**: 扫码登录微信公众号后台
5. **填写内容**: 自动填写标题、粘贴正文、填写作者
6. **保存草稿**: 点击保存按钮

### 核心技术点

- ✅ **新标签页处理**: 自动监听并切换到文章编辑页
- ✅ **富文本粘贴**: 使用系统剪贴板粘贴带格式内容
- ✅ **等待机制**: 智能等待页面加载和内容渲染
- ✅ **错误处理**: 完善的异常捕获和提示

## 常见问题排查

### ❓ posts 文件夹在哪里？

运行脚本后会自动创建 `posts/` 文件夹，或手动创建：
```bash
mkdir posts
```

### ❓ 如何处理多个 Markdown 文件？

默认处理第一个文件。如需处理其他文件，可以：
- 删除不需要的文件
- 或修改代码选择不同的文件

### ❓ Markdown 图片如何处理？

支持网络图片 URL，格式：
```markdown
![描述](https://example.com/image.jpg)
```

本地图片需要先上传到图床获取 URL。

### 🚨 登录失败问题

#### Q1: "Execution context was destroyed" 错误
这个错误通常发生在扫码登录过程中页面发生跳转导致的。

**解决方案:**
```bash
# 1. 使用调试工具
python debug_login.py

# 2. 清理旧的登录状态
rm cookies.json session.json

# 3. 确保网络连接稳定
```

#### Q2: 二维码无法显示或扫描失败
**排查步骤:**
- 确保 `headless=False` （显示浏览器窗口）
- 检查网络连接是否正常
- 尝试刷新页面或重新启动程序
- 使用调试脚本查看详细信息

#### Q3: Token过期或URL无效
如果您的 `url` 文件中的链接包含过期的token：

**解决方案:**
1. 手动登录微信公众号后台
2. 创建新文章，复制新的编辑器URL
3. 更新 `url` 文件内容
4. 重新运行程序

### 🔧 调试工具使用

我们提供了专门的调试脚本来帮助排查问题：

```bash
# 运行登录调试工具
python debug_login.py
```

**调试工具功能:**
- 完整登录流程调试
- URL访问测试
- 状态文件检查
- 自动截图保存

### 📋 问题排查清单

当遇到问题时，请按以下顺序检查：

1. **环境检查**
   ```bash
   # 检查Python版本 (需要3.7+)
   python --version
   
   # 检查依赖安装
   pip list | grep playwright
   pip list | grep aiofiles
   
   # 检查浏览器安装
   playwright install --help
   ```

2. **网络检查**
   - 确保能正常访问 mp.weixin.qq.com
   - 检查防火墙设置
   - 尝试使用VPN（如果在特殊网络环境）

3. **文件检查**
   ```bash
   # 查看URL文件
   cat url
   
   # 检查状态文件
   ls -la cookies.json session.json
   ```

4. **登录状态重置**
   ```bash
   # 清理所有状态
   rm cookies.json session.json *.png
   
   # 重新运行
   python debug_login.py
   ```

### 🎯 特定错误解决方案

#### 错误: "页面响应超时"
```python
# 在代码中增加超时时间
wechat = WeChatMPAutomation(headless=False)
wechat.page.set_default_timeout(60000)  # 60秒
```

#### 错误: "找不到编辑器元素"
1. 确保已成功登录
2. 检查URL是否正确
3. 尝试手动导航到编辑器页面
4. 更新编辑器选择器（如果微信更新了界面）

#### 错误: "无法保存cookies"
```bash
# 检查文件权限
chmod 644 cookies.json session.json

# 检查磁盘空间
df -h
```

### 📞 获取帮助

如果以上方法都无法解决问题：

1. 运行 `python debug_login.py` 收集调试信息
2. 查看生成的截图文件 (`*.png`)
3. 检查控制台输出的详细错误信息
4. 确认微信公众号后台是否有界面更新

## 开发说明

### 扩展功能

工具采用模块化设计，可以轻松扩展新功能：

```python
class WeChatMPAutomation:
    # 添加新方法
    async def upload_image(self, image_path: str):
        # 实现图片上传逻辑
        pass
    
    async def set_article_settings(self, **settings):
        # 实现文章设置逻辑
        pass
```

### 调试模式

```python
# 启用详细日志
import logging
logging.basicConfig(level=logging.DEBUG)

# 设置页面截图（调试用）
await page.screenshot(path="debug.png")
```

## 许可证

本项目仅供学习和研究使用，请遵守微信公众平台的使用条款。

## 更新日志

- v1.0.0: 基础功能实现，支持登录、写作、发布
- 计划功能: 图片上传、批量操作、定时发布等

## 技术支持

如果遇到问题，请检查：

1. Python 和依赖包版本
2. Playwright 浏览器是否正确安装
3. 网络连接和防火墙设置
4. 微信公众号后台是否有变化

---

**免责声明**: 本工具仅供学习交流使用，使用者需自行承担使用风险。请遵守相关平台的服务条款和法律法规。