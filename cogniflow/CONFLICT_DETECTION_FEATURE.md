# 时间冲突检测功能

## 功能概述

时间冲突检测功能会自动识别用户创建的日程事项之间的时间重叠，并通过醒目的视觉标识提醒用户存在冲突，帮助用户更好地管理时间安排。

## 使用示例

### 示例 1：基本冲突检测

**输入：**
```
今天下午2点开会
今天下午2点半有接待
```

**结果：**
- 两个事项都会被标记为冲突
- 第一个事项：14:00-15:00（默认1小时）
- 第二个事项：14:30-15:30（默认1小时）
- 重叠时间段：14:30-15:00（30分钟）

### 示例 2：指定时长

**输入：**
```
明天上午10点会议，2小时
明天上午11点培训
```

**结果：**
- 两个事项都会被标记为冲突
- 第一个事项：10:00-12:00
- 第二个事项：11:00-12:00
- 重叠时间段：11:00-12:00（1小时）

### 示例 3：无冲突的连续事项

**输入：**
```
今天上午9点会议，1小时
今天上午10点培训
```

**结果：**
- 两个事项都不会显示冲突标识
- 第一个事项：09:00-10:00
- 第二个事项：10:00-11:00
- 无重叠（第一个结束时第二个开始）

## 视觉效果

冲突的日程事项具有以下视觉特征：

1. **红色左边框**：卡片左侧有醒目的 4px 红色竖条
2. **淡红色背景**：整个卡片有淡红色背景高亮
3. **冲突标签**：标题旁显示红色"时间冲突"标签
4. **警告图标**：橙色三角形警告图标
5. **阴影效果**：红色阴影增强视觉效果
6. **悬停提示**：鼠标悬停显示详细的冲突说明

![冲突视觉效果](示意图)

## 工作原理

### 1. 冲突检测逻辑

系统使用以下算法判断两个时间段是否冲突：

```typescript
冲突条件（满足任一即为冲突）：
- A 的开始时间在 B 的时间范围内
- A 的结束时间在 B 的时间范围内
- A 完全包含 B
- B 完全包含 A
```

### 2. 自动检测时机

系统在以下操作后自动检测并更新冲突状态：

- ✅ 创建新的日程事项
- ✅ 编辑日程事项的时间
- ✅ 删除日程事项
- ✅ 归档日程事项
- ✅ 恢复归档的日程事项

### 3. 检测范围

- **事项类型**：仅检测 `event`（日程）类型的事项
- **用户隔离**：只检测同一用户的事项，不同用户间不会互相影响
- **状态过滤**：已删除和已归档的事项不参与冲突检测

## 技术实现

### 后端实现

**文件：** `server/routes/items.ts`

#### 主要函数

1. **detectTimeConflicts()**
   - 检测单个事项是否与其他事项冲突
   - 使用 SQL 查询找出时间重叠的事项
   - 支持排除特定事项（用于更新操作）

2. **updateConflictStatus()**
   - 批量更新用户所有事项的冲突状态
   - 采用两步策略：
     1. 先重置所有冲突状态
     2. 再检测所有事项对之间的冲突
   - 优化性能：使用数组批量更新

#### 数据库查询

```sql
-- 查询与指定时间范围重叠的事项
SELECT id, title, start_time, end_time
FROM items
WHERE user_id = $1
  AND deleted_at IS NULL
  AND type = 'event'
  AND start_time IS NOT NULL
  AND end_time IS NOT NULL
  AND (
    (start_time >= $2 AND start_time < $3) OR
    (end_time > $2 AND end_time <= $3) OR
    (start_time <= $2 AND end_time >= $3) OR
    ($2 <= start_time AND $3 >= end_time)
  )
```

### 前端实现

**文件：** `src/utils/conflictDetector.ts`

#### 工具函数

1. **hasTimeConflict()**
   - 判断两个时间范围是否有冲突
   - 纯函数，可独立测试

2. **detectConflicts()**
   - 检测一个事项与事项列表的冲突
   - 返回所有冲突的事项

3. **formatConflictMessage()**
   - 格式化冲突信息为用户友好的文本

### UI 组件

**文件：** `src/components/items/ItemCard.tsx`

#### 冲突显示逻辑

```tsx
// 确定边框和背景样式
const borderClass = hasConflict 
  ? 'border-l-4 border-l-red-500 bg-red-50/50 dark:bg-red-950/20' 
  : isOverdue
  ? 'border-l-4 border-l-orange-500'
  : priorityColors[item.priority];

// 冲突标签和提示
{hasConflict && (
  <Tooltip>
    <TooltipTrigger>
      <div className="conflict-badge">
        <AlertTriangle /> 时间冲突
      </div>
    </TooltipTrigger>
    <TooltipContent>
      ⚠️ 此日程与其他事项存在时间冲突
    </TooltipContent>
  </Tooltip>
)}
```

## 性能优化

### 数据库索引

为提高冲突检测查询性能，添加了以下索引：

```sql
-- 冲突检测复合索引
CREATE INDEX idx_items_conflict_detection 
ON items(user_id, type, deleted_at, start_time, end_time)
WHERE type = 'event' AND deleted_at IS NULL;

-- 冲突事项查询索引
CREATE INDEX idx_items_has_conflict 
ON items(user_id, has_conflict)
WHERE has_conflict = true AND deleted_at IS NULL;
```

### 查询优化策略

1. **部分索引**：只索引需要的数据（event 类型、未删除）
2. **复合索引**：包含所有查询条件，避免回表
3. **批量更新**：使用数组批量更新冲突状态
4. **增量更新**：只在必要时重新计算冲突状态

## API 变更

### has_conflict 字段

所有返回 `Item` 对象的 API 都会包含 `has_conflict` 字段：

```typescript
interface Item {
  // ... 其他字段
  has_conflict: boolean;  // 是否存在时间冲突
  start_time: string | null;
  end_time: string | null;
}
```

### 自动更新

以下 API 端点会在操作后自动更新相关事项的冲突状态：

- `POST /api/items` - 创建事项
- `PUT /api/items/:id` - 更新事项
- `DELETE /api/items/:id` - 删除事项
- `POST /api/items/:id/archive` - 归档事项
- `POST /api/items/:id/unarchive` - 恢复归档

## 测试

### 运行测试

1. 启动应用
```bash
npm run db:start
npm run server
npm run dev
```

2. 打开测试页面
```
http://localhost:5173/conflict-test.html
```

3. 按照测试页面的指引进行测试

### 测试覆盖

- ✅ 完全重叠
- ✅ 部分重叠（开始时间）
- ✅ 部分重叠（结束时间）
- ✅ 完全包含
- ✅ 连续事项（不冲突）
- ✅ 同时开始
- ✅ 多个事项冲突
- ✅ 编辑解决冲突
- ✅ 删除冲突事项
- ✅ 归档/恢复

## 未来改进

### 可能的增强功能

1. **冲突详情面板**
   - 显示具体冲突的事项列表
   - 点击冲突标签跳转到冲突事项

2. **智能建议**
   - 自动推荐可用的时间段
   - 提供一键调整时间的功能

3. **冲突解决向导**
   - 引导用户逐步解决冲突
   - 批量调整冲突事项

4. **可视化时间轴**
   - 图形化显示所有事项的时间分布
   - 直观展示冲突区域

5. **通知提醒**
   - 创建冲突时弹出提醒
   - 提供取消或继续的选项

## 常见问题

### Q1: 为什么任务（task）类型不检测冲突？

**A:** 任务通常只有截止日期，没有明确的开始和结束时间，不适合用于时间冲突检测。只有日程（event）类型有完整的时间范围。

### Q2: 如何修改默认的事项时长？

**A:** 目前默认时长为 1 小时，这是在 `src/utils/ai.ts` 中配置的。你可以在创建事项时明确指定时长，例如"下午2点开会，2小时"。

### Q3: 归档的事项会参与冲突检测吗？

**A:** 不会。已归档的事项不参与冲突检测，只有活跃的事项才会被检测。

### Q4: 如何查看所有有冲突的事项？

**A:** 在前端可以通过筛选 `has_conflict = true` 的事项来查看。未来版本可能会添加专门的冲突视图。

### Q5: 冲突检测会影响性能吗？

**A:** 不会。我们通过数据库索引和批量更新优化了查询性能，即使有大量事项也能快速完成检测。

## 相关文档

- [测试指南](./CONFLICT_DETECTION_GUIDE.md) - 详细的测试步骤和用例
- [API 文档](./docs/API_ROUTES_FIX_20251101.md) - API 端点说明
- [数据库架构](./database/init/01_schema.sql) - 数据库表结构

## 更新日志

### v1.0.0 (2025-11-02)

- ✨ 初始版本发布
- ✅ 实现基本的时间冲突检测
- ✅ 添加醒目的视觉标识
- ✅ 支持自动更新冲突状态
- ✅ 优化数据库查询性能
- ✅ 完整的测试用例覆盖

---

**作者：** CogniFlow 团队  
**最后更新：** 2025年11月2日
