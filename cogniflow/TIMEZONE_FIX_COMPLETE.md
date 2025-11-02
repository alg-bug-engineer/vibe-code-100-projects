# 时间处理修复说明

## 问题
用户输入的时间和显示的时间相差8小时（时区问题）

## 解决方案

### 1. 数据库层面
- 已将 `due_date`、`start_time`、`end_time` 等字段从 `TIMESTAMP WITH TIME ZONE` 改为 `TIMESTAMP`（不带时区）
- 这样数据库直接存储本地时间，不进行时区转换

### 2. 前端处理

#### EditItemDialog.tsx
- `formatDateTimeLocal()`: 将数据库返回的时间字符串转换为 datetime-local 输入框格式
- `formatToISOWithoutTimezone()`: 将输入框的值转换为不带时区的 ISO 格式（如 "2025-11-02T18:00:00"）

#### ItemCard.tsx
- `parseLocalDateTime()`: 将不带时区的时间字符串正确解析为本地时间的 Date 对象

### 3. AI 处理
- AI 返回的时间格式：`YYYY-MM-DDTHH:mm:ss`（不带时区）
- 直接发送到服务器，存储到数据库

### 4. 服务器端
- 服务器端不做任何时区转换，直接传递时间字符串到数据库

## 测试流程
1. 创建一个事件："明天下午6点开会"
2. 预期存储和显示的时间：2025-11-02 18:00:00
3. 验证显示的时间是否正确

## 已清空数据
所有旧数据已清空，可以重新测试
