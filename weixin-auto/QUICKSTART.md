# 快速上手指南

## 🚀 一分钟批量发布文章

### 第一步：安装依赖

```bash
pip install -r requirements.txt
playwright install chromium
```

### 第二步：准备 Markdown 文章

项目已包含 4 个示例文章，直接运行即可测试！

或者在 `posts/` 文件夹中添加你的文章：

```markdown
# 我的文章标题

这是文章内容...
```

### 第三步：运行批量发布脚本

```bash
python markdown_to_wechat.py
```

### 第四步：扫码登录

脚本会显示处理计划，按回车开始，然后扫码登录。

### 第五步：自动批量处理

全自动完成所有文章处理：
- ✅ **逐篇转换** Markdown 格式
- ✅ **自动填写** 标题和内容  
- ✅ **保存草稿** 到微信公众号
- ✅ **文件归档** 移动到 done/ 目录
- ✅ **进度统计** 显示成功/失败数量

## ⚙️ 批量处理控制

### 默认作者名设置

编辑 `markdown_to_wechat.py` 文件中的 `process_single_article` 方法：

```python
async def process_single_article(self, markdown_file, title=None, author="你的名字"):
    # 修改 author 默认值
```

### 处理特定文件

如果只想处理某些文件：

1. **临时移动法**：将不需要的文件移出 `posts/` 目录
2. **修改代码法**：在 `main()` 函数中过滤文件

```python
# 只处理包含特定关键词的文件
md_files = [f for f in md_files if "python" in f.name.lower()]
```

### 暂停处理

运行过程中如需中断，直接关闭浏览器即可。已处理的文件会正常归档。

## 工作流程图

```
读取 Markdown 文件
      ↓
打开 md.doocs.org
      ↓
粘贴并转换格式
      ↓
复制富文本内容
      ↓
登录微信公众号
      ↓
填写文章信息
      ↓
保存为草稿 ✓
```

## 注意事项

1. **网络连接**：需要稳定的网络访问 md.doocs.org
2. **图片处理**：使用网络图片 URL，不支持本地图片
3. **等待时间**：首次运行需要扫码登录，约需 1-2 分钟
4. **格式保留**：支持标题、列表、代码块、引用等格式

## 常见 Markdown 语法

### 标题
```markdown
# 一级标题
## 二级标题
### 三级标题
```

### 文字样式
```markdown
**粗体**
*斜体*
`代码`
```

### 列表
```markdown
1. 有序列表
2. 第二项

- 无序列表
- 第二项
```

### 代码块
````markdown
```python
def hello():
    print("Hello!")
```
````

### 引用
```markdown
> 这是引用文字
```

### 链接和图片
```markdown
[链接文字](https://example.com)
![图片描述](https://example.com/image.jpg)
```

## 故障排查

### 问题：找不到文章按钮

**解决**：检查是否已成功登录，页面是否完全加载

### 问题：粘贴内容为空

**解决**：
1. 确保网络连接正常
2. 增加等待时间（修改代码中的 `await asyncio.sleep(6)`）
3. 手动检查 md.doocs.org 是否可访问

### 问题：格式丢失

**解决**：确保使用的是剪贴板粘贴（Cmd+V / Ctrl+V），不是纯文本粘贴

## 更多帮助

查看完整文档：[README.md](README.md)
