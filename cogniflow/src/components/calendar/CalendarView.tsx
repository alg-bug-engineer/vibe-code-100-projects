import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

import { itemApi } from '@/db/api';
import type { Item } from '@/types/types';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addMonths, eachDayOfInterval, isSameDay, isToday, isSameMonth } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import ItemCard from '@/components/items/ItemCard';

/**
 * 将不带时区的ISO时间字符串解析为本地时间
 * 避免时区转换问题
 */
const parseLocalDateTime = (dateTimeString: string): Date => {
  if (!dateTimeString.includes('Z') && !dateTimeString.includes('+') && !dateTimeString.includes('T')) {
    return new Date(dateTimeString + 'T00:00:00');
  }
  
  if (!dateTimeString.includes('Z') && !dateTimeString.match(/[+-]\d{2}:\d{2}$/)) {
    const parts = dateTimeString.split(/[-T:]/);
    return new Date(
      parseInt(parts[0]),
      parseInt(parts[1]) - 1,
      parseInt(parts[2]),
      parseInt(parts[3] || '0'),
      parseInt(parts[4] || '0'),
      parseInt(parts[5] || '0')
    );
  }
  
  return new Date(dateTimeString);
};

interface CalendarViewProps {
  onUpdate?: () => void;
}

// 日历视图组件 - 月视图
export default function CalendarView({ onUpdate }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarItems, setCalendarItems] = useState<Item[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedDateItems, setSelectedDateItems] = useState<Item[]>([]);

  useEffect(() => {
    loadCalendarItems();
  }, [currentDate]);

  const loadCalendarItems = async () => {
    const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 });

    const startStr = format(start, 'yyyy-MM-dd');
    const endStr = format(end, 'yyyy-MM-dd');

    // @ts-ignore - 新方法 TypeScript 还未识别
    const items = await itemApi.getCalendarItems(startStr, endStr);
    setCalendarItems(items);
  };

  const handlePrevious = () => {
    setCurrentDate(addMonths(currentDate, -1));
  };

  const handleNext = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    const dateStr = format(date, 'yyyy-MM-dd');
    const items = calendarItems.filter(item => {
      const itemDate = item.due_date || item.start_time;
      if (!itemDate) return false;
      return itemDate.split('T')[0] === dateStr;
    });
    setSelectedDateItems(items);
  };

  const getItemsForDate = (date: Date): Item[] => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return calendarItems.filter(item => {
      const itemDate = item.due_date || item.start_time;
      if (!itemDate) return false;
      return itemDate.split('T')[0] === dateStr;
    });
  };

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    
    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    const weekDays = ['一', '二', '三', '四', '五', '六', '日'];

    return (
      <div className="space-y-2">
        {/* 星期标题 */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {weekDays.map(day => (
            <div key={day} className="text-center text-sm font-medium text-gray-600 dark:text-gray-400 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* 日期格子 */}
        <div className="grid grid-cols-7 gap-2">
          {days.map((day, index) => {
            const items = getItemsForDate(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isTodayDate = isToday(day);
            const isSelected = selectedDate && isSameDay(day, selectedDate);

            return (
              <Card
                key={index}
                className={`
                  min-h-[100px] p-2 cursor-pointer transition-all hover:shadow-md
                  ${!isCurrentMonth ? 'opacity-40 bg-gray-50 dark:bg-gray-900' : ''}
                  ${isTodayDate ? 'ring-2 ring-blue-500' : ''}
                  ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-400' : ''}
                `}
                onClick={() => handleDateClick(day)}
              >
                <div className={`
                  text-sm font-medium mb-1
                  ${isTodayDate ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-gray-100'}
                `}>
                  {format(day, 'd')}
                </div>
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
                          {format(parseLocalDateTime(item.start_time), 'HH:mm')}
                          {item.end_time && ` - ${format(parseLocalDateTime(item.end_time), 'HH:mm')}`}
                        </div>
                      )}
                    </div>
                  ))}
                  {items.length > 3 && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      +{items.length - 3} 更多
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    );
  };



  return (
    <div className="space-y-4">
      {/* 顶部控制栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrevious}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleToday}>
            今天
          </Button>
          <h2 className="text-xl font-semibold ml-4">
            {format(currentDate, 'yyyy年MM月', { locale: zhCN })}
          </h2>
        </div>
      </div>

      {/* 统计信息 */}
      <div className="flex gap-4 text-sm">
        <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/20">
          任务: {calendarItems.filter(i => i.type === 'task').length}
        </Badge>
        <Badge variant="outline" className="bg-green-50 dark:bg-green-900/20">
          日程: {calendarItems.filter(i => i.type === 'event').length}
        </Badge>
      </div>

      {/* 日历视图 */}
      {renderMonthView()}

      {/* 选中日期的详细内容 */}
      {selectedDate && selectedDateItems.length > 0 && (
        <Card className="p-4 mt-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            {format(selectedDate, 'yyyy年MM月dd日 EEEE', { locale: zhCN })}
            <Badge variant="outline">{selectedDateItems.length} 项</Badge>
          </h3>
          <div className="space-y-3">
            {selectedDateItems.map(item => (
              <ItemCard key={item.id} item={item} onUpdate={() => {
                loadCalendarItems();
                onUpdate?.();
              }} />
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
