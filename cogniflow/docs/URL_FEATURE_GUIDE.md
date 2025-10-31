# URL链接功能使用指南

## 功能概述

CogniFlow v1.3.0 新增了智能URL链接管理功能,当您输入URL链接时,系统会自动:
1. 识别URL
2. 访问网站并抓取内容
3. 使用AI生成网站内容梗概
4. 保存到专属的"链接库"

## 使用方法

### 1. 添加链接

在底部输入框中直接粘贴URL链接,例如:
```
https://www.example.com/article
```

系统会自动:
- ✅ 检测这是一个URL
- ✅ 显示"正在抓取网页内容..."提示
- ✅ 访问网站并提取信息
- ✅ 使用AI生成简洁的中文梗概(100-150字)
- ✅ 保存到链接库

### 2. 查看链接库

点击底部导航栏的"链接库"tab,可以看到所有保存的链接。

每个链接卡片包含:
- 📌 网站标题
- 🖼️ 缩略图(如果有)
- 📝 AI生成的内容梗概
- 🔗 原始URL
- 🏷️ 自动生成的标签
- 📅 保存时间

### 3. 打开链接

点击链接卡片右上角的"打开链接"按钮(外部链接图标),在新标签页中打开原网站。

### 4. 删除链接

点击链接卡片右上角的"删除"按钮(垃圾桶图标),删除不需要的链接。

### 5. 搜索链接

在顶部搜索框中输入关键词,可以搜索:
- 网站标题
- 内容梗概
- URL地址
- 标签

## 技术实现

### 前端

#### URL检测
```typescript
// 自动检测输入是否为URL
const detectedURL = detectURL(inputText);
const isURL = detectedURL && isMainlyURL(inputText);
```

#### URL处理流程
```typescript
if (isURL && detectedURL) {
  // 1. 调用Edge Function抓取网页
  const urlResult = await fetchURLContent(detectedURL);
  
  // 2. 创建URL类型的条目
  const newItem = await itemApi.createItem({
    type: 'url',
    url: urlResult.url,
    url_title: urlResult.title,
    url_summary: urlResult.summary,
    url_thumbnail: urlResult.thumbnail,
    // ...
  });
}
```

### 后端

#### Edge Function: fetch-url-content

位置: `supabase/functions/fetch-url-content/index.ts`

功能:
1. **网页抓取**: 使用fetch API获取HTML内容
2. **信息提取**:
   - 标题: 从`<title>`或`og:title`提取
   - 缩略图: 从`og:image`或`twitter:image`提取
   - 文本内容: 移除script/style标签,提取纯文本
3. **AI梗概生成**: 调用Gemini API生成中文梗概

#### 数据库Schema

新增字段(items表):
```sql
url text                    -- URL地址
url_title text              -- 网站标题
url_summary text            -- AI生成的梗概
url_thumbnail text          -- 缩略图URL
url_fetched_at timestamptz  -- 抓取时间
```

新增类型:
```sql
ALTER TYPE item_type ADD VALUE 'url';
```

## 使用场景

### 1. 文章收藏
```
输入: https://blog.example.com/best-practices
结果: 自动提取文章标题和摘要,方便日后查阅
```

### 2. 资料整理
```
输入: https://docs.example.com/api-reference
结果: 保存技术文档链接,AI生成内容概要
```

### 3. 新闻收集
```
输入: https://news.example.com/breaking-news
结果: 快速保存新闻链接,梗概帮助快速回顾
```

### 4. 学习资源
```
输入: https://tutorial.example.com/react-hooks
结果: 收集学习资源,梗概说明主要内容
```

## 注意事项

### 1. URL格式要求
- ✅ 支持: `http://` 和 `https://`
- ✅ 支持: 带参数的URL
- ❌ 不支持: 不完整的URL(如 `www.example.com`)

### 2. 网站访问限制
某些网站可能无法抓取:
- 需要登录的网站
- 有反爬虫机制的网站
- 动态加载内容的SPA应用

### 3. AI梗概生成
- 需要配置`GEMINI_API_KEY`环境变量
- 如果未配置,会使用简单的文本截取作为梗概
- 梗概长度: 100-150字

### 4. 性能考虑
- 网页抓取可能需要几秒钟
- 输入框会立即清空,不影响继续输入
- 后台异步处理,完成后自动刷新

## 配置说明

### 环境变量

需要在Supabase项目中配置以下环境变量:

```bash
GEMINI_API_KEY=your_gemini_api_key_here
```

配置方法:
1. 使用`supabase_bulk_create_secrets`工具
2. 或在Supabase Dashboard中手动配置

### Edge Function部署

Edge Function已自动部署:
- 函数名: `fetch-url-content`
- 端点: `{SUPABASE_URL}/functions/v1/fetch-url-content`
- 方法: POST
- 参数: `{ url: string }`

## 故障排查

### 问题1: 抓取失败

**症状**: 提示"抓取网页内容失败"

**可能原因**:
- URL格式不正确
- 网站无法访问
- 网站有反爬虫机制

**解决方法**:
- 检查URL是否完整
- 尝试在浏览器中打开URL
- 更换其他网站测试

### 问题2: 梗概质量差

**症状**: 生成的梗概不准确或太简单

**可能原因**:
- GEMINI_API_KEY未配置
- 网站内容质量差
- 网站是动态加载的

**解决方法**:
- 配置GEMINI_API_KEY
- 手动编辑梗概内容
- 尝试其他类似网站

### 问题3: 缩略图不显示

**症状**: 链接卡片没有缩略图

**可能原因**:
- 网站没有设置og:image
- 图片URL无效
- 图片加载失败

**解决方法**:
- 这是正常现象,不是所有网站都有缩略图
- 不影响其他功能使用

## 未来计划

### v1.4.0
- [ ] 支持批量导入URL
- [ ] URL分类和文件夹管理
- [ ] 定期重新抓取更新内容
- [ ] 导出链接为Markdown/HTML

### v1.5.0
- [ ] 网页全文保存(离线阅读)
- [ ] 网页标注和高亮
- [ ] 分享链接集合
- [ ] 协作收藏功能

## 相关文档

- [CHANGELOG.md](./CHANGELOG.md) - 版本更新日志
- [FEATURES.md](./FEATURES.md) - 功能清单
- [TOPICS_OPTIMIZATION.md](./TOPICS_OPTIMIZATION.md) - 主题页面优化说明

---

**版本**: v1.3.0  
**日期**: 2025-10-27  
**作者**: CogniFlow Team
