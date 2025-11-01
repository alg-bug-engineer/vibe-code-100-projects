import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CheckCircle2, Circle, Edit, Archive, ArchiveRestore, Trash2, Calendar, AlertCircle, AlertTriangle } from 'lucide-react';
import { format, isToday } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import type { Item } from '@/types/types';
import { itemApi } from '@/db/api';
import { toast } from 'sonner';
import { useState } from 'react';
import EditItemDialog from './EditItemDialog';

interface ItemCardProps {
  item: Item;
  onUpdate?: () => void;
}

const typeLabels = {
  task: '任务',
  event: '日程',
  note: '笔记',
  data: '资料',
  url: '链接'
};

const typeColors = {
  task: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  event: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  note: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  data: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  url: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200'
};

const priorityColors = {
  high: 'border-l-4 border-l-red-500',
  medium: 'border-l-4 border-l-yellow-500',
  low: 'border-l-4 border-l-green-500'
};

export default function ItemCard({ item, onUpdate }: ItemCardProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);

  const isCompleted = item.status === 'completed';
  // 过期判断：只有截止日期在今天之前（不包括今天）才算过期
  const isOverdue = item.due_date && (() => {
    const dueDate = new Date(item.due_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // 设置为当天00:00:00
    dueDate.setHours(0, 0, 0, 0); // 设置为截止日期00:00:00
    return dueDate < today && !isCompleted;
  })();
  const hasConflict = item.has_conflict && item.type === 'event';
  const isArchived = item.archived_at !== null;

  const handleToggleComplete = async () => {
    const newStatus = isCompleted ? 'pending' : 'completed';
    const success = await itemApi.updateItem(item.id, { status: newStatus });

    if (success) {
      toast.success(isCompleted ? '已标记为未完成' : '已完成');
      onUpdate?.();
    } else {
      toast.error('操作失败');
    }
  };

  const handleArchive = async () => {
    if (isArchived) {
      // 恢复归档
      const success = await itemApi.unarchiveItem(item.id);
      if (success) {
        toast.success('已恢复');
        onUpdate?.();
      } else {
        toast.error('恢复失败');
      }
    } else {
      // 归档
      const success = await itemApi.archiveItem(item.id);
      if (success) {
        toast.success('已归档');
        onUpdate?.();
      } else {
        toast.error('归档失败');
      }
    }
  };

  const handleDelete = async () => {
    if (!confirm('确定要删除这条记录吗?')) return;

    const success = await itemApi.deleteItem(item.id);

    if (success) {
      toast.success('已删除');
      onUpdate?.();
    } else {
      toast.error('删除失败');
    }
  };

  // 确定边框颜色: 冲突优先级最高
  const borderClass = hasConflict 
    ? 'border-l-4 border-l-red-500' 
    : (priorityColors[item.priority as keyof typeof priorityColors] || '');

  return (
    <>
      <Card className={`
        group relative max-w-3xl
        ${borderClass} 
        ${isCompleted ? 'opacity-50' : ''} 
        hover:shadow-lg hover:scale-[1.01] 
        transition-all duration-200 ease-out
        border border-gray-200 dark:border-gray-800
        bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm
      `}>
        {/* 悬浮操作按钮 */}
        <div className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-all duration-200 flex gap-1 z-10">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 bg-white/90 dark:bg-gray-800/90 backdrop-blur hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg shadow-sm"
            onClick={() => setIsEditOpen(true)}
            title="编辑"
          >
            <Edit className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 bg-white/90 dark:bg-gray-800/90 backdrop-blur hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg shadow-sm"
            onClick={handleArchive}
            title={isArchived ? "恢复" : "归档"}
          >
            {isArchived ? (
              <ArchiveRestore className="h-3.5 w-3.5" />
            ) : (
              <Archive className="h-3.5 w-3.5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 bg-white/90 dark:bg-gray-800/90 backdrop-blur hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg shadow-sm"
            onClick={handleDelete}
            title="删除"
          >
            <Trash2 className="h-3.5 w-3.5 text-red-500" />
          </Button>
        </div>

        <CardHeader className="pb-3 pt-4 px-4">
          <div className="flex items-start gap-3 pr-24">
            {(item.type === 'task' || item.type === 'event') && (
              <Button
                variant="ghost"
                size="sm"
                className="p-0 h-5 w-5 mt-0.5 flex-shrink-0 hover:bg-transparent"
                onClick={handleToggleComplete}
              >
                {isCompleted ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500 hover:text-green-600 transition-colors" />
                ) : (
                  <Circle className="h-5 w-5 text-gray-300 hover:text-gray-400 transition-colors" />
                )}
              </Button>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <CardTitle className={`text-base font-medium ${isCompleted ? 'line-through text-gray-400' : 'text-gray-900 dark:text-gray-100'}`}>
                  {item.title || '无标题'}
                </CardTitle>
                {hasConflict && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>⚠️ 此日程存在时间冲突</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              
              {/* 日程类型：显示完整的日期时间信息 */}
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
              
              {/* 非日程类型：保持原有的简洁显示 */}
              {item.type !== 'event' && (
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={`${typeColors[item.type]} text-xs px-2 py-0.5 font-normal`}>
                    {typeLabels[item.type]}
                  </Badge>
                  {item.due_date && (
                    <div className={`
                      flex items-center gap-1 text-xs px-2 py-0.5 rounded-md
                      ${isOverdue 
                        ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' 
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}
                    `}>
                      {isOverdue && <AlertCircle className="h-3 w-3" />}
                      <Calendar className="h-3 w-3" />
                      <span className="font-medium">
                        {isToday(new Date(item.due_date))
                          ? '今天'
                          : format(new Date(item.due_date), 'MM月dd日 HH:mm', { locale: zhCN })}
                      </span>
                    </div>
                  )}
                </div>
              )}
              
              {/* 日程类型也显示类型标签 */}
              {item.type === 'event' && (
                <div className="flex items-center gap-2 flex-wrap mt-2">
                  <Badge className={`${typeColors[item.type]} text-xs px-2 py-0.5 font-normal`}>
                    {typeLabels[item.type]}
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="py-0 pb-3 px-4 space-y-2">
          {item.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed pl-8">
              {item.description}
            </p>
          )}
          {item.tags && item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pl-8">
              {item.tags.map((tag, index) => (
                <Badge 
                  key={index} 
                  variant="outline" 
                  className="text-xs px-2 py-0 font-normal border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400"
                >
                  #{tag}
                </Badge>
              ))}
            </div>
          )}
          <div className="pt-1 pl-8">
            <span className="text-xs text-gray-400 dark:text-gray-600">
              {format(new Date(item.created_at), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
            </span>
          </div>
        </CardContent>
      </Card>

      <EditItemDialog
        item={item}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        onUpdate={onUpdate}
      />
    </>
  );
}
