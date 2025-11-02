# 智能模板功能 - 快速开始

## 🚀 快速启动

### 1. 运行数据库迁移

```bash
# 进入项目目录
cd /Users/zhangqilai/project/vibe-code-100-projects/cogniflow

# 运行迁移脚本
psql -U postgres -d cogniflow -f database/migrations/005_smart_templates.sql
```

### 2. 启动后端服务

```bash
cd server
npm run dev
```

应该看到输出包含：
```
📋 可用端点:
  - GET  /api/templates          (获取模板)
```

### 3. 启动前端

```bash
# 在另一个终端
npm run dev
```

## 📝 使用示例

### 基础使用

1. **打开应用**，登录到仪表盘
2. **在底部输入框输入** `/`
3. **选择模板**，例如 "📰 /日报"
4. **填写内容**：
   - 标题会自动生成（如 "11月2日 每日工作日志"）
   - 默认子任务已预填充
   - 可以添加更多子任务
   - 可以添加备注
5. **点击保存**
6. **在"即将发生"视图中查看**你的集合卡片

### 进阶使用

#### 勾选完成子任务
- 在卡片上直接点击子任务前的复选框
- 进度条会自动更新
- 全部完成后卡片自动折叠

#### 管理集合
- 点击卡片右上角的 ⋮ 菜单
- 可以归档或删除集合

#### 搜索集合
- 在搜索框中搜索关键词
- 集合类型的卡片会正常显示

## 🎯 默认模板

### 1. 日报 📰
```
触发词: /日报
用途: 记录每日工作进展
默认子任务:
  - 总结今日完成的工作
  - 记录遇到的问题
  - 规划明日工作计划
```

### 2. 会议 👥
```
触发词: /会议
用途: 记录会议纪要
默认子任务:
  - 记录会议议题
  - 记录讨论要点
  - 记录行动项
```

### 3. 月报 📅
```
触发词: /月报
用途: 月度工作总结
默认子任务:
  - 本月工作完成情况
  - 重点成果与亮点
  - 下月工作计划
```

## 📊 数据查询示例

### 查询本周的日报
```sql
SELECT 
  title,
  created_at,
  sub_items,
  description
FROM items
WHERE type = 'collection'
  AND collection_type = '日报'
  AND created_at >= date_trunc('week', CURRENT_DATE)
ORDER BY created_at DESC;
```

### 统计完成进度
```sql
SELECT 
  id,
  title,
  jsonb_array_length(sub_items) as total_tasks,
  (
    SELECT COUNT(*)
    FROM jsonb_array_elements(sub_items) AS item
    WHERE item->>'status' = 'done'
  ) as completed_tasks
FROM items
WHERE type = 'collection'
  AND collection_type = '日报';
```

### 生成周报数据
```sql
WITH daily_logs AS (
  SELECT 
    title,
    description,
    sub_items,
    created_at
  FROM items
  WHERE type = 'collection'
    AND collection_type = '日报'
    AND created_at BETWEEN '2025-10-28' AND '2025-11-03'
  ORDER BY created_at
)
SELECT 
  json_agg(
    json_build_object(
      'date', created_at::date,
      'title', title,
      'summary', description,
      'tasks', sub_items
    )
  ) as weekly_data
FROM daily_logs;
```

## 🔧 故障排查

### 问题：模板菜单不显示
**解决**：
1. 确保输入的是 `/` 字符（不是中文全角）
2. 检查浏览器控制台是否有错误
3. 确认后端服务正在运行

### 问题：保存后看不到卡片
**解决**：
1. 检查"即将发生"标签页
2. 确认数据库迁移已运行
3. 查看浏览器控制台的网络请求

### 问题：子任务勾选不生效
**解决**：
1. 确保登录状态有效
2. 检查网络连接
3. 查看浏览器控制台的错误信息

## 🎨 自定义样式

如果需要自定义集合卡片的样式，编辑：
```
src/components/items/CollectionCard.tsx
```

## 📱 API 调用示例

### JavaScript 获取模板
```javascript
const response = await fetch('http://localhost:3001/api/templates', {
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});
const templates = await response.json();
```

### 创建新模板
```javascript
const newTemplate = {
  trigger_word: '周报',
  template_name: '周度工作总结',
  icon: '📊',
  collection_type: '周报',
  default_tags: ['工作', '周报'],
  default_sub_items: [
    { id: '1', text: '本周完成的工作', status: 'pending' },
    { id: '2', text: '下周工作计划', status: 'pending' },
  ],
};

const response = await fetch('http://localhost:3001/api/templates', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(newTemplate),
});
```

## 🎯 下一步

完成模板管理界面，实现：
1. 模板列表展示
2. 创建自定义模板
3. 编辑现有模板
4. 删除模板
5. 模板排序

参考文件位置：
```
src/pages/TemplateManagement.tsx  (待创建)
src/components/templates/         (待创建)
```

---

**提示**: 这个功能是完全实现的，可以立即使用！🎉
