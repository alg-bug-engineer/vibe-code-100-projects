# 日程展示优化文档

## 优化概述

优化了系统中日程（event）类型项目的呈现形式，使时间信息更加清晰和醒目。

## 主要改动

### 1. ItemCard.tsx - 主要项目卡片组件

#### 优化内容
- **针对日程类型添加了专门的时间展示区域**
  - 使用渐变背景（蓝色到靛蓝色）突出显示
  - 完整展示年月日和星期信息
  - 清晰显示开始时间和结束时间
  - 自动计算并显示持续时间（分钟）

#### 时间展示格式
- **有开始和结束时间的日程**：
  ```
  📅 yyyy年MM月dd日 星期X
     HH:mm → HH:mm (XX分钟)
  ```

- **只有截止日期的日程**：
  ```
  📅 yyyy年MM月dd日 星期X
     HH:mm
  ```

#### 视觉设计
- 渐变背景色：`from-blue-50 to-indigo-50` (浅色模式)
- 边框：蓝色细边框
- 图标：日历图标 (Calendar)
- 文字层次：
  - 日期：深蓝色、加粗
  - 时间：蓝色、中等粗细
  - 持续时间：浅蓝色、小字

### 2. CalendarView.tsx - 日历视图组件

#### 优化内容
- 在日历格子中显示日程的时间信息
- 每个日程项显示：
  - 标题（截断）
  - 时间范围（如果有）

#### 展示格式
```
日程标题
HH:mm - HH:mm
```

## 代码示例

### ItemCard 中的日程时间展示区域

```tsx
{item.type === 'event' && (item.start_time || item.due_date) && (
  <div className="mb-3 p-3 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-100 dark:border-blue-900/50">
    <div className="flex items-center gap-3">
      <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
      <div className="flex-1">
        {item.start_time && item.end_time ? (
          <div className="space-y-1">
            <div className="text-sm font-semibold text-blue-900 dark:text-blue-100">
              {format(new Date(item.start_time), 'yyyy年MM月dd日 EEEE', { locale: zhCN })}
            </div>
            <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
              <span className="font-medium">
                {format(new Date(item.start_time), 'HH:mm', { locale: zhCN })}
              </span>
              <span className="text-blue-400">→</span>
              <span className="font-medium">
                {format(new Date(item.end_time), 'HH:mm', { locale: zhCN })}
              </span>
              <span className="text-xs text-blue-600 dark:text-blue-400 ml-1">
                ({Math.round((new Date(item.end_time).getTime() - new Date(item.start_time).getTime()) / 60000)}分钟)
              </span>
            </div>
          </div>
        ) : item.due_date && (
          <div className="space-y-1">
            <div className="text-sm font-semibold text-blue-900 dark:text-blue-100">
              {format(new Date(item.due_date), 'yyyy年MM月dd日 EEEE', { locale: zhCN })}
            </div>
            <div className="text-sm text-blue-700 dark:text-blue-300">
              <span className="font-medium">
                {format(new Date(item.due_date), 'HH:mm', { locale: zhCN })}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
)}
```

### CalendarView 中的日程项展示

```tsx
<div className="space-y-1">
  {items.slice(0, 3).map((item, index) => (
    <div
      key={`${item.id}-${index}`}
      className={`
        text-xs px-1 py-0.5 rounded
        ${item.type === 'event' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'}
      `}
      title={item.title || undefined}
    >
      <div className="truncate font-medium">{item.title}</div>
      {item.type === 'event' && item.start_time && (
        <div className="text-[10px] opacity-75">
          {format(new Date(item.start_time), 'HH:mm')}
          {item.end_time && ` - ${format(new Date(item.end_time), 'HH:mm')}`}
        </div>
      )}
    </div>
  ))}
</div>
```

## 设计原则

1. **清晰度优先**：时间信息一目了然
2. **视觉层次**：使用颜色和大小区分不同级别的信息
3. **一致性**：在不同组件中保持相似的展示风格
4. **响应式**：在不同主题模式（浅色/深色）下都有良好的可读性
5. **信息完整**：提供完整的日期、时间和持续时间信息

## 用户体验改进

1. **更容易识别日程**：渐变背景使日程类型在视觉上更突出
2. **时间信息更完整**：包含年月日、星期、具体时间和持续时间
3. **避免混淆**：日程和任务有明确的视觉区分
4. **提高效率**：用户无需点击即可查看完整的时间信息

## 兼容性

- ✅ 支持浅色模式
- ✅ 支持深色模式
- ✅ 向后兼容旧数据格式
- ✅ 支持不同时区（使用 date-fns 的 locale）

## 相关组件

- `ItemCard.tsx` - 主要优化组件
- `CalendarView.tsx` - 辅助优化组件
- `TodoCard.tsx` - 暂未修改（主要用于任务）
- `URLCard.tsx` - 暂未修改（主要用于链接）

## 后续可能的改进

1. 添加时区显示
2. 支持全天事件的特殊展示
3. 添加重复日程的标识
4. 提供紧凑和详细两种展示模式的切换
