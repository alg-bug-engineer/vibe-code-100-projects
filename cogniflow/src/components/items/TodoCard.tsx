import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Circle, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Edit, 
  Archive, 
  Trash2,
  Tag as TagIcon,
  Calendar
} from 'lucide-react';
import { format, isToday } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import type { Item, TaskStatus } from '@/types/types';
import { itemApi } from '@/db/api';
import { toast } from 'sonner';
import { useState } from 'react';
import EditItemDialog from './EditItemDialog';

/**
 * 将不带时区的ISO时间字符串解析为本地时间
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

interface TodoCardProps {
  item: Item;
  onUpdate: () => void;
}

const statusLabels = {
  pending: '待处理',
  'in-progress': '进行中',
  blocked: '已阻塞',
  completed: '已完成'
};

const statusColors = {
  pending: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
  'in-progress': 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
  blocked: 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400',
  completed: 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400'
};

const statusIcons = {
  pending: Circle,
  'in-progress': Clock,
  blocked: AlertCircle,
  completed: CheckCircle2
};

const priorityColors = {
  high: 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800',
  medium: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
  low: 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800'
};

const priorityLabels = {
  high: '高优先级',
  medium: '中优先级',
  low: '低优先级'
};

export default function TodoCard({ item, onUpdate }: TodoCardProps) {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const StatusIcon = statusIcons[item.status as TaskStatus] || Circle;
  
  // 过期判断：只有截止日期在今天之前（不包括今天）才算过期
  const isOverdue = item.due_date && (() => {
    const dueDate = parseLocalDateTime(item.due_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // 设置为当天00:00:00
    dueDate.setHours(0, 0, 0, 0); // 设置为截止日期00:00:00
    return dueDate < today && item.status !== 'completed';
  })();

  const handleStatusChange = async (newStatus: TaskStatus) => {
    if (isUpdatingStatus) return;
    
    setIsUpdatingStatus(true);
    try {
      await itemApi.updateItem(item.id, {
        ...item,
        status: newStatus,
        updated_at: new Date().toISOString()
      });
      
      toast.success(`任务状态已更新为${statusLabels[newStatus]}`);
      onUpdate();
    } catch (error) {
      console.error('更新任务状态失败:', error);
      toast.error('更新任务状态失败');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleArchive = async () => {
    try {
      await itemApi.updateItem(item.id, {
        ...item,
        archived_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
      toast.success('任务已归档');
      onUpdate();
    } catch (error) {
      console.error('归档任务失败:', error);
      toast.error('归档任务失败');
    }
  };

  const handleDelete = async () => {
    if (!confirm('确定要删除这个任务吗？此操作无法撤销。')) return;
    
    try {
      await itemApi.deleteItem(item.id);
      toast.success('任务已删除');
      onUpdate();
    } catch (error) {
      console.error('删除任务失败:', error);
      toast.error('删除任务失败');
    }
  };

  return (
    <>
      <Card className={`transition-all hover:shadow-md ${
        item.priority === 'high' ? 'border-l-4 border-l-red-500' :
        item.priority === 'medium' ? 'border-l-4 border-l-yellow-500' :
        'border-l-4 border-l-green-500'
      }`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <StatusIcon className={`h-4 w-4 ${
                  item.status === 'completed' ? 'text-green-600' :
                  item.status === 'in-progress' ? 'text-blue-600' :
                  item.status === 'blocked' ? 'text-red-600' :
                  'text-gray-400'
                }`} />
                <h3 className={`font-medium text-sm ${
                  item.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900 dark:text-gray-100'
                }`}>
                  {item.title || '无标题任务'}
                </h3>
                {isOverdue && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>任务已过期</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              
              <div className="flex items-center gap-2 flex-wrap">
                {/* 状态选择器 */}
                <Select
                  value={item.status}
                  onValueChange={handleStatusChange}
                  disabled={isUpdatingStatus}
                >
                  <SelectTrigger className="w-24 h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">待处理</SelectItem>
                    <SelectItem value="in-progress">进行中</SelectItem>
                    <SelectItem value="blocked">已阻塞</SelectItem>
                    <SelectItem value="completed">已完成</SelectItem>
                  </SelectContent>
                </Select>

                {/* 优先级 */}
                <Badge className={`${priorityColors[item.priority as keyof typeof priorityColors]} text-xs px-2 py-0.5 font-normal`}>
                  {priorityLabels[item.priority as keyof typeof priorityLabels] || item.priority}
                </Badge>

                {/* 截止日期 */}
                {item.due_date && (
                  <div className={`
                    flex items-center gap-1 text-xs px-2 py-0.5 rounded-md
                    ${isOverdue 
                      ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' 
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}
                  `}>
                    <Calendar className="h-3 w-3" />
                    <span className="font-medium">
                      {isToday(parseLocalDateTime(item.due_date))
                        ? '今天'
                        : format(parseLocalDateTime(item.due_date), 'MM月dd日', { locale: zhCN })}
                    </span>
                  </div>
                )}

                {/* 标签 */}
                {item.tags && item.tags.length > 0 && (
                  <div className="flex items-center gap-1">
                    <TagIcon className="h-3 w-3 text-gray-400" />
                    <div className="flex gap-1">
                      {item.tags.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs px-1 py-0">
                          {tag}
                        </Badge>
                      ))}
                      {item.tags.length > 2 && (
                        <Badge variant="outline" className="text-xs px-1 py-0">
                          +{item.tags.length - 2}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowEditDialog(true)}
                className="h-8 w-8 p-0"
              >
                <Edit className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleArchive}
                className="h-8 w-8 p-0"
              >
                <Archive className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {item.description && (
          <CardContent className="pt-0 pb-3">
            <p className={`text-sm ${
              item.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-600 dark:text-gray-300'
            }`}>
              {item.description}
            </p>
          </CardContent>
        )}
      </Card>

      <EditItemDialog
        item={item}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onUpdate={onUpdate}
      />
    </>
  );
}