import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Search } from 'lucide-react';
import ItemCard from '@/components/items/ItemCard';
import { URLCard } from '@/components/url/URLCard';
import type { Item } from '@/types/types';
import { useEffect, useRef } from 'react';

interface QueryResultPanelProps {
  items: Item[];
  summary: string;
  onClose: () => void;
  onUpdate?: () => void;
  onDeleteURL?: (id: string) => void;
}

export function QueryResultPanel({ 
  items, 
  summary, 
  onClose, 
  onUpdate,
  onDeleteURL 
}: QueryResultPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // 处理ESC键关闭
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // 处理点击外部关闭
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    // 延迟添加监听器,避免立即触发
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 flex items-end justify-center pb-32">
      <Card 
        ref={panelRef}
        className="w-full max-w-4xl max-h-[60vh] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4 duration-300"
      >
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Search className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">{summary}</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              title="关闭 (ESC)"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-4 overflow-y-auto max-h-[calc(60vh-80px)]">
          {items.length === 0 ? (
            <div className="text-center py-12">
              <Search className="w-16 h-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">未找到匹配的记录</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                尝试使用不同的关键词或时间范围
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                item.type === 'url' ? (
                  <URLCard 
                    key={item.id} 
                    item={item} 
                    onDelete={onDeleteURL} 
                  />
                ) : (
                  <ItemCard 
                    key={item.id} 
                    item={item} 
                    onUpdate={onUpdate} 
                  />
                )
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
