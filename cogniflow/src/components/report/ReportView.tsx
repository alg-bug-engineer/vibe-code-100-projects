import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  PieChart, 
  Calendar, 
  FileText, 
  TrendingUp,
  CheckCircle2,
  Tag,
  Link as LinkIcon,
  Lightbulb,
  Loader2
} from 'lucide-react';
import { itemApi } from '@/db/api';
import type { Item, TagStats } from '@/types/types';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { generateSmartSummary } from '@/utils/ai';

interface ReportData {
  totalItems: number;
  completedTasks: number;
  pendingTasks: number;
  events: number;
  notes: number;
  urls: number;
  tags: TagStats[];
  items: Item[];
}

interface SmartSummary {
  content: string;
  isGenerating: boolean;
}

export default function ReportView() {
  const [activeTab, setActiveTab] = useState('statistics');
  const [reportPeriod, setReportPeriod] = useState<'today' | 'week' | 'month'>('week');
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [smartSummary, setSmartSummary] = useState<SmartSummary>({ content: '', isGenerating: false });
  const [loading, setLoading] = useState(true);

  const loadReportData = async () => {
    setLoading(true);
    try {
      const now = new Date();
      let startDate: Date;
      let endDate: Date;

      switch (reportPeriod) {
        case 'today':
          startDate = startOfDay(now);
          endDate = endOfDay(now);
          break;
        case 'week':
          startDate = startOfWeek(now, { weekStartsOn: 1 });
          endDate = endOfWeek(now, { weekStartsOn: 1 });
          break;
        case 'month':
          startDate = startOfMonth(now);
          endDate = endOfMonth(now);
          break;
      }

      const startDateStr = format(startDate, 'yyyy-MM-dd');
      const endDateStr = format(endDate, 'yyyy-MM-dd');

      const [items, tags] = await Promise.all([
        itemApi.getHistoryByDateRange(startDateStr, endDateStr),
        itemApi.getTagStats()
      ]);

      const data: ReportData = {
        totalItems: items.length,
        completedTasks: items.filter((item: Item) => item.type === 'task' && item.status === 'completed').length,
        pendingTasks: items.filter((item: Item) => item.type === 'task' && item.status !== 'completed').length,
        events: items.filter((item: Item) => item.type === 'event').length,
        notes: items.filter((item: Item) => item.type === 'note').length,
        urls: items.filter((item: Item) => item.type === 'url').length,
        tags: tags.slice(0, 10), // 取前10个标签
        items
      };

      setReportData(data);
    } catch (error) {
      console.error('加载报告数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    if (!reportData || reportData.items.length === 0) {
      return;
    }

    setSmartSummary({ content: '', isGenerating: true });

    try {
      const periodName = {
        today: '今日',
        week: '本周',
        month: '本月'
      }[reportPeriod];

      const summary = await generateSmartSummary(reportData.items, periodName);
      setSmartSummary({ content: summary, isGenerating: false });
    } catch (error) {
      console.error('生成智能报告失败:', error);
      setSmartSummary({ 
        content: '抱歉，生成智能报告时出现错误，请稍后重试。', 
        isGenerating: false 
      });
    }
  };

  useEffect(() => {
    loadReportData();
  }, [reportPeriod]);

  const getPeriodLabel = () => {
    const now = new Date();
    switch (reportPeriod) {
      case 'today':
        return format(now, 'yyyy年MM月dd日', { locale: zhCN });
      case 'week':
        const weekStart = startOfWeek(now, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
        return `${format(weekStart, 'MM月dd日', { locale: zhCN })} - ${format(weekEnd, 'MM月dd日', { locale: zhCN })}`;
      case 'month':
        return format(now, 'yyyy年MM月', { locale: zhCN });
    }
  };

  const getTaskCompletionRate = () => {
    if (!reportData || (reportData.completedTasks + reportData.pendingTasks) === 0) return 0;
    return Math.round((reportData.completedTasks / (reportData.completedTasks + reportData.pendingTasks)) * 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600 dark:text-gray-400">加载报告数据...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 头部控制 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">智能报告</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            数据统计与智能汇总 · {getPeriodLabel()}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={reportPeriod === 'today' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setReportPeriod('today')}
          >
            今日
          </Button>
          <Button
            variant={reportPeriod === 'week' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setReportPeriod('week')}
          >
            本周
          </Button>
          <Button
            variant={reportPeriod === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setReportPeriod('month')}
          >
            本月
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="statistics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            统计仪表盘
          </TabsTrigger>
          <TabsTrigger value="summary" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            智能汇总
          </TabsTrigger>
        </TabsList>

        <TabsContent value="statistics" className="space-y-6 mt-6">
          {reportData && (
            <>
              {/* 核心指标卡片 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">总条目</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{reportData.totalItems}</div>
                    <p className="text-xs text-muted-foreground">
                      包含任务、事件、笔记和链接
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">任务完成率</CardTitle>
                    <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{getTaskCompletionRate()}%</div>
                    <Progress value={getTaskCompletionRate()} className="mt-2" />
                    <p className="text-xs text-muted-foreground mt-2">
                      已完成 {reportData.completedTasks} / {reportData.completedTasks + reportData.pendingTasks} 个任务
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">日程安排</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{reportData.events}</div>
                    <p className="text-xs text-muted-foreground">
                      事件和会议
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">知识收集</CardTitle>
                    <LinkIcon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{reportData.notes + reportData.urls}</div>
                    <p className="text-xs text-muted-foreground">
                      笔记 {reportData.notes} · 链接 {reportData.urls}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* 类型分布图表 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PieChart className="h-5 w-5" />
                      内容类型分布
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">任务</span>
                        <Badge variant="secondary">{reportData.completedTasks + reportData.pendingTasks}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">事件</span>
                        <Badge variant="secondary">{reportData.events}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">笔记</span>
                        <Badge variant="secondary">{reportData.notes}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">链接</span>
                        <Badge variant="secondary">{reportData.urls}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Tag className="h-5 w-5" />
                      热门标签
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {reportData.tags.length === 0 ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                          暂无标签数据
                        </p>
                      ) : (
                        reportData.tags.map((tag, index) => (
                          <div key={tag.tag} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-1 rounded">
                                #{index + 1}
                              </span>
                              <span className="text-sm">{tag.tag}</span>
                            </div>
                            <Badge variant="outline">{tag.count}</Badge>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="summary" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5" />
                    智能汇总报告
                  </CardTitle>
                  <CardDescription>
                    AI 为您生成的{getPeriodLabel()}工作与生活汇总
                  </CardDescription>
                </div>
                <Button
                  onClick={generateReport}
                  disabled={smartSummary.isGenerating || !reportData || reportData.totalItems === 0}
                  size="sm"
                >
                  {smartSummary.isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      生成中...
                    </>
                  ) : (
                    <>
                      <TrendingUp className="h-4 w-4 mr-2" />
                      生成报告
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {!reportData || reportData.totalItems === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-16 w-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    该时间段内暂无数据
                  </p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                    请选择其他时间段或添加一些内容
                  </p>
                </div>
              ) : smartSummary.content ? (
                <div className="prose prose-gray dark:prose-invert max-w-none">
                  <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 leading-relaxed">
                    {smartSummary.content}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Lightbulb className="h-16 w-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    点击"生成报告"按钮，让 AI 为您生成智能汇总
                  </p>
                  <Button onClick={generateReport} disabled={smartSummary.isGenerating}>
                    <TrendingUp className="h-4 w-4 mr-2" />
                    生成智能报告
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}