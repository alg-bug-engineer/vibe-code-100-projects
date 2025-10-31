# 日历视图和重复任务功能实现指南

## 概述

本文档提供日历视图和重复性任务功能的详细实现指南。这两个功能已完成数据库设计和类型定义,但需要额外的前端组件和后端逻辑。

---

## 功能3: 日历视图

### 当前状态
- ✅ 数据库字段已添加 (`start_time`, `end_time`)
- ✅ TypeScript类型已定义
- ✅ 冲突检测已实现
- ⏳ 日历组件待实现

### 实现步骤

#### 步骤1: 安装日历组件库

```bash
pnpm add react-big-calendar date-fns
pnpm add -D @types/react-big-calendar
```

#### 步骤2: 创建日历视图组件

创建 `src/components/calendar/CalendarView.tsx`:

```typescript
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import type { Item } from '@/types/types';

const locales = {
  'zh-CN': zhCN,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface CalendarViewProps {
  items: Item[];
  onSelectEvent: (item: Item) => void;
}

export function CalendarView({ items, onSelectEvent }: CalendarViewProps) {
  // 转换items为日历事件格式
  const events = items
    .filter(item => item.start_time && item.end_time)
    .map(item => ({
      id: item.id,
      title: item.title || '无标题',
      start: new Date(item.start_time!),
      end: new Date(item.end_time!),
      resource: item,
      // 冲突事项使用红色背景
      style: item.has_conflict ? {
        backgroundColor: '#ef4444',
        borderColor: '#dc2626',
      } : undefined,
    }));

  return (
    <div className="h-[600px] bg-white dark:bg-gray-800 p-4 rounded-lg">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        onSelectEvent={(event) => onSelectEvent(event.resource)}
        culture="zh-CN"
        messages={{
          today: '今天',
          previous: '上一页',
          next: '下一页',
          month: '月',
          week: '周',
          day: '日',
          agenda: '议程',
        }}
      />
    </div>
  );
}
```

#### 步骤3: 集成到Dashboard

在 `src/pages/Dashboard.tsx` 的主题Tab中添加日历子Tab:

```typescript
// 在topicsSubTab状态中添加 'calendar' 选项
const [topicsSubTab, setTopicsSubTab] = useState<'tags' | 'history' | 'calendar'>('tags');

// 添加日历数据加载
const [calendarItems, setCalendarItems] = useState<Item[]>([]);

const loadCalendarData = async () => {
  // 获取所有有时间的事项
  const items = await itemApi.getCalendarItems();
  setCalendarItems(items);
};

// 在主题Tab的二级导航中添加日历选项
<TabsList className="grid w-full grid-cols-3">
  <TabsTrigger value="tags">标签</TabsTrigger>
  <TabsTrigger value="history">历史记录</TabsTrigger>
  <TabsTrigger value="calendar">日历</TabsTrigger>
</TabsList>

<TabsContent value="calendar">
  <CalendarView 
    items={calendarItems}
    onSelectEvent={(item) => {
      // 打开编辑对话框或显示详情
      console.log('Selected event:', item);
    }}
  />
</TabsContent>
```

#### 步骤4: 添加API方法

在 `src/db/api.ts` 中添加:

```typescript
async getCalendarItems(): Promise<Item[]> {
  const { data, error } = await supabase
    .from('items')
    .select('*')
    .is('archived_at', null)
    .not('start_time', 'is', null)
    .not('end_time', 'is', null)
    .order('start_time', { ascending: true });

  if (error) {
    console.error('获取日历数据失败:', error);
    return [];
  }

  return Array.isArray(data) ? data : [];
}
```

### 样式优化

创建 `src/styles/calendar.css`:

```css
/* 自定义日历样式 */
.rbc-calendar {
  font-family: inherit;
}

.rbc-event {
  border-radius: 4px;
  padding: 2px 5px;
}

.rbc-event.rbc-selected {
  background-color: #3b82f6;
}

.rbc-today {
  background-color: #eff6ff;
}

/* 暗色模式支持 */
.dark .rbc-calendar {
  background-color: #1f2937;
  color: #f9fafb;
}

.dark .rbc-header {
  border-color: #374151;
  color: #f9fafb;
}

.dark .rbc-day-bg {
  border-color: #374151;
}

.dark .rbc-today {
  background-color: #1e3a8a;
}
```

---

## 功能4: 重复性任务

### 当前状态
- ✅ 数据库字段已添加 (`recurrence_rule`, `recurrence_end_date`, `master_item_id`, `is_master`)
- ✅ TypeScript类型已定义
- ⏳ AI识别待实现
- ⏳ 编辑界面待实现
- ⏳ 实例生成逻辑待实现

### 实现步骤

#### 步骤1: 安装RRULE库

```bash
pnpm add rrule
```

#### 步骤2: 创建重复规则组件

创建 `src/components/recurrence/RecurrenceEditor.tsx`:

```typescript
import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RRule } from 'rrule';

interface RecurrenceEditorProps {
  value: string | null;
  onChange: (rrule: string | null) => void;
}

export function RecurrenceEditor({ value, onChange }: RecurrenceEditorProps) {
  const [freq, setFreq] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | 'NONE'>('NONE');
  const [interval, setInterval] = useState(1);
  const [count, setCount] = useState<number | null>(null);
  const [until, setUntil] = useState<string | null>(null);

  const generateRRule = () => {
    if (freq === 'NONE') {
      onChange(null);
      return;
    }

    const options: any = {
      freq: RRule[freq],
      interval,
    };

    if (count) {
      options.count = count;
    } else if (until) {
      options.until = new Date(until);
    }

    const rule = new RRule(options);
    onChange(rule.toString());
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>重复频率</Label>
        <Select value={freq} onValueChange={(v: any) => {
          setFreq(v);
          setTimeout(generateRRule, 0);
        }}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="NONE">不重复</SelectItem>
            <SelectItem value="DAILY">每天</SelectItem>
            <SelectItem value="WEEKLY">每周</SelectItem>
            <SelectItem value="MONTHLY">每月</SelectItem>
            <SelectItem value="YEARLY">每年</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {freq !== 'NONE' && (
        <>
          <div>
            <Label>间隔</Label>
            <Input
              type="number"
              min={1}
              value={interval}
              onChange={(e) => {
                setInterval(parseInt(e.target.value));
                setTimeout(generateRRule, 0);
              }}
            />
          </div>

          <div>
            <Label>结束条件</Label>
            <Select value={count ? 'count' : until ? 'until' : 'never'} onValueChange={(v) => {
              if (v === 'never') {
                setCount(null);
                setUntil(null);
              } else if (v === 'count') {
                setCount(10);
                setUntil(null);
              } else {
                setCount(null);
                setUntil(new Date().toISOString().split('T')[0]);
              }
              setTimeout(generateRRule, 0);
            }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="never">永不结束</SelectItem>
                <SelectItem value="count">重复次数</SelectItem>
                <SelectItem value="until">结束日期</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {count !== null && (
            <div>
              <Label>重复次数</Label>
              <Input
                type="number"
                min={1}
                value={count}
                onChange={(e) => {
                  setCount(parseInt(e.target.value));
                  setTimeout(generateRRule, 0);
                }}
              />
            </div>
          )}

          {until !== null && (
            <div>
              <Label>结束日期</Label>
              <Input
                type="date"
                value={until}
                onChange={(e) => {
                  setUntil(e.target.value);
                  setTimeout(generateRRule, 0);
                }}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
```

#### 步骤3: 集成到EditItemDialog

在 `src/components/items/EditItemDialog.tsx` 中添加重复选项:

```typescript
import { RecurrenceEditor } from '@/components/recurrence/RecurrenceEditor';

// 在表单中添加
{(item.type === 'task' || item.type === 'event') && (
  <div className="space-y-2">
    <Label>重复规则</Label>
    <RecurrenceEditor
      value={item.recurrence_rule}
      onChange={(rrule) => {
        // 更新重复规则
        itemApi.updateItem(item.id, { 
          recurrence_rule: rrule,
          is_master: rrule !== null 
        });
      }}
    />
  </div>
)}
```

#### 步骤4: 创建实例生成Edge Function

创建 `supabase/functions/generate-recurrence-instances/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { RRule } from 'npm:rrule@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 获取所有母版条目
    const { data: masters, error } = await supabase
      .from('items')
      .select('*')
      .eq('is_master', true)
      .not('recurrence_rule', 'is', null);

    if (error) throw error;

    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30); // 生成未来30天的实例

    for (const master of masters || []) {
      try {
        // 解析RRULE
        const rule = RRule.fromString(master.recurrence_rule);
        
        // 生成实例日期
        const occurrences = rule.between(now, futureDate);

        for (const date of occurrences) {
          // 检查实例是否已存在
          const { data: existing } = await supabase
            .from('items')
            .select('id')
            .eq('master_item_id', master.id)
            .eq('due_date', date.toISOString())
            .maybeSingle();

          if (!existing) {
            // 创建新实例
            await supabase.from('items').insert({
              user_id: master.user_id,
              raw_text: master.raw_text,
              type: master.type,
              title: master.title,
              description: master.description,
              due_date: date.toISOString(),
              start_time: master.start_time ? new Date(new Date(master.start_time).setDate(date.getDate())).toISOString() : null,
              end_time: master.end_time ? new Date(new Date(master.end_time).setDate(date.getDate())).toISOString() : null,
              priority: master.priority,
              status: 'pending',
              tags: master.tags,
              entities: master.entities,
              master_item_id: master.id,
              is_master: false,
            });
          }
        }
      } catch (err) {
        console.error(`处理母版 ${master.id} 失败:`, err);
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: '实例生成完成' }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
```

#### 步骤5: 设置定时任务

使用Supabase的Cron Jobs功能,每天执行一次实例生成:

```sql
-- 在Supabase Dashboard中创建Cron Job
-- 或使用pg_cron扩展

SELECT cron.schedule(
  'generate-recurrence-instances',
  '0 0 * * *', -- 每天午夜执行
  $$
  SELECT net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/generate-recurrence-instances',
    headers := '{"Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
  );
  $$
);
```

#### 步骤6: 增强AI识别重复性描述

在 `src/utils/ai.ts` 中添加重复性识别:

```typescript
// 在系统提示中添加
重复性识别:
- "每天" -> FREQ=DAILY
- "每周五" -> FREQ=WEEKLY;BYDAY=FR
- "每月1号" -> FREQ=MONTHLY;BYMONTHDAY=1
- "每年" -> FREQ=YEARLY

如果检测到重复性描述,在返回的JSON中添加:
"recurrence_rule": "FREQ=WEEKLY;BYDAY=FR",
"is_master": true
```

---

## 测试建议

### 日历视图测试
1. 创建多个有时间的日程
2. 检查日历是否正确显示
3. 测试月/周/日视图切换
4. 验证冲突事项的红色高亮
5. 测试点击事项打开详情

### 重复任务测试
1. 创建每日重复任务
2. 创建每周重复任务
3. 验证实例是否正确生成
4. 测试编辑单个实例
5. 测试编辑所有未来实例
6. 验证完成单个实例不影响其他实例

---

## 性能优化建议

### 日历视图
- 使用虚拟滚动优化大量事项
- 按需加载月份数据
- 缓存日历事件数据

### 重复任务
- 限制实例生成的时间范围(如30天)
- 使用后台任务生成实例
- 定期清理过期的已完成实例
- 为master_item_id创建索引

---

## 安全注意事项

1. **权限控制**: 确保用户只能访问自己的重复任务
2. **RLS策略**: 为重复任务实例添加Row Level Security
3. **实例限制**: 限制单个母版可生成的最大实例数
4. **错误处理**: 处理RRULE解析失败的情况

---

## 未来增强

1. **日历视图**
   - 拖拽调整事项时间
   - 日历中直接创建事项
   - 多日历视图(工作/个人)
   - 导出到iCal格式

2. **重复任务**
   - 更复杂的重复规则(如"每月最后一个工作日")
   - 跳过特定日期
   - 批量编辑重复任务
   - 重复任务模板

---

## 相关资源

- [React Big Calendar文档](https://github.com/jquense/react-big-calendar)
- [RRule.js文档](https://github.com/jakubroztocil/rrule)
- [iCalendar RRULE规范](https://icalendar.org/iCalendar-RFC-5545/3-8-5-3-recurrence-rule.html)
- [Supabase Cron Jobs](https://supabase.com/docs/guides/database/extensions/pg_cron)

---

**注意**: 本指南提供了完整的实现路径,但由于复杂度较高,建议分阶段实施:
1. 第一阶段: 实现基础日历视图
2. 第二阶段: 实现简单重复任务(每天/每周)
3. 第三阶段: 实现复杂重复规则和高级功能
