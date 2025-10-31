import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface ProcessingCardProps {
  text: string;
}

export default function ProcessingCard({ text }: ProcessingCardProps) {
  return (
    <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600 dark:text-blue-400 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {text}
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
              AI正在处理中...
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <div className="h-2 flex-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 dark:bg-blue-400 rounded-full animate-pulse w-2/3"></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
