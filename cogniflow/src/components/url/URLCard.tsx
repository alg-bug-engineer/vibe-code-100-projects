import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Calendar, Tag, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import type { Item } from '@/types/types';

interface URLCardProps {
  item: Item;
  onDelete?: (id: string) => void;
}

export function URLCard({ item, onDelete }: URLCardProps) {
  const handleOpenURL = () => {
    if (item.url) {
      window.open(item.url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* 左侧缩略图 - 固定宽度 */}
          {item.url_thumbnail && (
            <div className="w-32 h-24 flex-shrink-0 rounded-md overflow-hidden bg-muted">
              <img
                src={item.url_thumbnail}
                alt={item.url_title || '网站缩略图'}
                className="w-full h-full object-cover"
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.parentElement!.style.display = 'none';
                }}
              />
            </div>
          )}

          {/* 右侧内容 */}
          <div className="flex-1 min-w-0 flex flex-col gap-2">
            {/* 标题和操作按钮 */}
            <div className="flex items-start justify-between gap-3">
              <h3 
                className="font-semibold text-base leading-tight cursor-pointer hover:text-primary transition-colors line-clamp-2"
                onClick={handleOpenURL}
                title={item.url_title || item.title || '未知标题'}
              >
                {item.url_title || item.title || '未知标题'}
              </h3>
              
              {/* 操作按钮 - hover时显示 */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={handleOpenURL}
                  title="打开链接"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </Button>
                {onDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => onDelete(item.id)}
                    title="删除"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-600" />
                  </Button>
                )}
              </div>
            </div>

            {/* 摘要 */}
            {item.url_summary && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {item.url_summary}
              </p>
            )}

            {/* 底部信息：URL、标签、时间 */}
            <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground mt-auto">
              {/* URL */}
              {item.url && (
                <div className="flex items-center gap-1 min-w-0 flex-1">
                  <ExternalLink className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{new URL(item.url).hostname}</span>
                </div>
              )}

              {/* 标签 */}
              {item.tags && item.tags.length > 0 && (
                <div className="flex items-center gap-1">
                  <Tag className="w-3 h-3 flex-shrink-0" />
                  <div className="flex gap-1">
                    {item.tags.slice(0, 2).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs h-5">
                        {tag}
                      </Badge>
                    ))}
                    {item.tags.length > 2 && (
                      <Badge variant="secondary" className="text-xs h-5">
                        +{item.tags.length - 2}
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* 时间 */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <Calendar className="w-3 h-3" />
                <span>
                  {format(new Date(item.created_at), 'yyyy-MM-dd', { locale: zhCN })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
