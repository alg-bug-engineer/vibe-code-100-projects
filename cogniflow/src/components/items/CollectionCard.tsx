import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChevronDown, ChevronUp, MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Item, SubItem } from '@/types/types';
import { toast } from 'sonner';

interface CollectionCardProps {
  item: Item;
  onUpdate?: (id: string, updates: Partial<Item>) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

export function CollectionCard({ item, onUpdate, onDelete }: CollectionCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  
  const subItems = item.sub_items || [];
  const completedCount = subItems.filter((i) => i.status === 'done').length;
  const totalCount = subItems.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const isAllCompleted = totalCount > 0 && completedCount === totalCount;

  // 自动折叠已完成的卡片
  const shouldAutoCollapse = isAllCompleted;

  const handleToggleSubItem = async (subItemId: string) => {
    if (!onUpdate) return;

    const updatedSubItems = subItems.map((si) =>
      si.id === subItemId
        ? { ...si, status: si.status === 'pending' ? 'done' : 'pending' }
        : si
    ) as SubItem[];

    try {
      await onUpdate(item.id, { sub_items: updatedSubItems });
      toast.success('已更新');
    } catch (error) {
      console.error('更新失败:', error);
      toast.error('更新失败');
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    
    if (confirm('确定要删除这个集合吗？')) {
      try {
        await onDelete(item.id);
        toast.success('已删除');
      } catch (error) {
        console.error('删除失败:', error);
        toast.error('删除失败');
      }
    }
  };

  const handleArchive = async () => {
    if (!onUpdate) return;
    
    try {
      await onUpdate(item.id, { archived_at: new Date().toISOString() });
      toast.success('已归档');
    } catch (error) {
      console.error('归档失败:', error);
      toast.error('归档失败');
    }
  };

  // 获取图标（从标题中提取或使用默认）
  const getIcon = () => {
    if (item.collection_type === '日报') return '📰';
    if (item.collection_type === '会议') return '👥';
    if (item.collection_type === '月报') return '📅';
    return '📝';
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 flex-1">
            <span className="text-2xl">{getIcon()}</span>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{item.title}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-muted-foreground">
                  {completedCount}/{totalCount} 完成
                </span>
                <Progress value={progress} className="h-1.5 w-24" />
                {isAllCompleted && (
                  <Badge variant="default" className="text-xs">
                    已完成
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleArchive}>
                  归档
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                  删除
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      {(isExpanded || !shouldAutoCollapse) && (
        <CardContent className="space-y-3">
          {/* 子任务列表 */}
          {subItems.length > 0 && (
            <div className="space-y-2">
              {subItems.map((subItem) => (
                <div
                  key={subItem.id}
                  className="flex items-start gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors"
                >
                  <Checkbox
                    checked={subItem.status === 'done'}
                    onCheckedChange={() => handleToggleSubItem(subItem.id)}
                    className="mt-0.5"
                  />
                  <span
                    className={`flex-1 text-sm ${
                      subItem.status === 'done'
                        ? 'line-through text-muted-foreground'
                        : ''
                    }`}
                  >
                    {subItem.text}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* 备注 */}
          {item.description && (
            <div className="pt-2 border-t">
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {item.description}
              </p>
            </div>
          )}

          {/* 标签 */}
          {item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-2">
              {item.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
