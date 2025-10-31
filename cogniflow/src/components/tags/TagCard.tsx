import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tag, TrendingUp, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import type { TagStats } from '@/types/types';

interface TagCardProps {
  tagStats: TagStats;
  onClick: () => void;
}

export default function TagCard({ tagStats, onClick }: TagCardProps) {
  const { tag, count, lastUsed } = tagStats;

  const getTagColor = (count: number) => {
    if (count >= 10) return 'bg-purple-100 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700';
    if (count >= 5) return 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700';
    if (count >= 3) return 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700';
    return 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700';
  };

  const getIconColor = (count: number) => {
    if (count >= 10) return 'text-purple-600 dark:text-purple-400';
    if (count >= 5) return 'text-blue-600 dark:text-blue-400';
    if (count >= 3) return 'text-green-600 dark:text-green-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  const timeAgo = formatDistanceToNow(new Date(lastUsed), {
    addSuffix: true,
    locale: zhCN
  });

  return (
    <Card
      className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 ${getTagColor(count)} border-2`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Tag className={`h-5 w-5 flex-shrink-0 ${getIconColor(count)}`} />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg truncate text-gray-900 dark:text-gray-100">
                {tag}
              </h3>
            </div>
          </div>
          <Badge variant="secondary" className="flex-shrink-0">
            {count} 条
          </Badge>
        </div>

        <div className="mt-3 flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <TrendingUp className="h-4 w-4" />
            <span>使用 {count} 次</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{timeAgo}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
