import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Search, Inbox, Tag, CalendarDays, Link as LinkIcon, History, Archive, Calendar, Filter, X, CheckCircle2, FileText } from 'lucide-react';
import QuickInput from '@/components/items/QuickInput';
import ItemCard from '@/components/items/ItemCard';
import TodoCard from '@/components/items/TodoCard';
import ProcessingCard from '@/components/items/ProcessingCard';
import TagCard from '@/components/tags/TagCard';
import { URLCard } from '@/components/url/URLCard';
import CalendarView from '@/components/calendar/CalendarView';
import ReportView from '@/components/report/ReportView';
import { itemApi } from '@/db/api';
import type { Item, TagStats } from '@/types/types';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface ProcessingItem {
  id: string;
  text: string;
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('upcoming');
  const [topicsSubTab, setTopicsSubTab] = useState('tags'); // 'tags' | 'history' | 'calendar'
  const [upcomingItems, setUpcomingItems] = useState<Item[]>([]);
  const [todoItems, setTodoItems] = useState<Item[]>([]);
  const [inboxItems, setInboxItems] = useState<Item[]>([]);
  const [urlItems, setUrlItems] = useState<Item[]>([]);
  const [archivedItems, setArchivedItems] = useState<Item[]>([]);
  const [tagStats, setTagStats] = useState<TagStats[]>([]);
  const [historyItems, setHistoryItems] = useState<Item[]>([]);
  const [filteredHistoryItems, setFilteredHistoryItems] = useState<Item[]>([]);
  const [historyDateRange, setHistoryDateRange] = useState<{ start: string; end: string } | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [tagItems, setTagItems] = useState<Item[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Item[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [processingItems, setProcessingItems] = useState<ProcessingItem[]>([]);

  const loadData = async () => {
    console.log('🔄 开始加载数据...');
    const [upcoming, todos, inbox, urls, archived, tags, history] = await Promise.all([
      itemApi.getUpcomingItems(),
      itemApi.getTodoItems(),
      itemApi.getInboxItems(),
      itemApi.getURLItems(),
      itemApi.getArchivedItems(),
      itemApi.getTagStats(),
      itemApi.getAllItemsHistory()
    ]);

    console.log('📊 数据加载完成:', {
      upcoming: upcoming.length,
      todos: todos.length,
      inbox: inbox.length,
      urls: urls.length,
      archived: archived.length,
      tags: tags.length,
      history: history.length
    });

    setUpcomingItems(upcoming);
    setTodoItems(todos);
    setInboxItems(inbox);
    setUrlItems(urls);
    setArchivedItems(archived);
    setTagStats(tags);
    setHistoryItems(history);
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const searchItems = async () => {
      if (searchQuery.trim()) {
        setIsSearching(true);
        // 将搜索关键词转换为数组
        const keywords = searchQuery.trim().split(/\s+/);
        const results = await itemApi.searchItems(keywords);
        setSearchResults(results);
      } else {
        setIsSearching(false);
        setSearchResults([]);
      }
    };

    const timer = setTimeout(searchItems, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleTagClick = async (tag: string) => {
    setSelectedTag(tag);
    const items = await itemApi.getItemsByTag(tag);
    setTagItems(items);
  };

  const handleProcessingStart = (text: string, id: string) => {
    setProcessingItems(prev => [...prev, { id, text }]);
  };

  const handleProcessingComplete = (id: string) => {
    setProcessingItems(prev => prev.filter(item => item.id !== id));
    loadData();
  };

  const handleProcessingError = (id: string) => {
    setProcessingItems(prev => prev.filter(item => item.id !== id));
  };

  const handleDeleteURL = async (id: string) => {
    const success = await itemApi.deleteItem(id);
    if (success) {
      loadData();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 pb-32">
      <div className="max-w-4xl mx-auto p-4 pt-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            CogniFlow
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {format(new Date(), 'yyyy年MM月dd日 EEEE', { locale: zhCN })}
          </p>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="搜索笔记、任务、日程、链接..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {isSearching ? (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              搜索结果 ({searchResults.length})
            </h2>
            {searchResults.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                未找到相关内容
              </p>
            ) : (
              <div className="space-y-3">
                {searchResults.map((item) => (
                  item.type === 'url' ? (
                    <URLCard key={item.id} item={item} onDelete={handleDeleteURL} />
                  ) : (
                    <ItemCard key={item.id} item={item} onUpdate={loadData} />
                  )
                ))}
              </div>
            )}
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-7 mb-6">
              <TabsTrigger value="upcoming" className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                即将发生
              </TabsTrigger>
              <TabsTrigger value="todos" className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                待办清单
              </TabsTrigger>
              <TabsTrigger value="inbox" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                笔记
              </TabsTrigger>
              <TabsTrigger value="links" className="flex items-center gap-2">
                <LinkIcon className="h-4 w-4" />
                链接库
              </TabsTrigger>
              <TabsTrigger value="archived" className="flex items-center gap-2">
                <Archive className="h-4 w-4" />
                归档
              </TabsTrigger>
              <TabsTrigger value="topics" className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                主题
              </TabsTrigger>
              <TabsTrigger value="report" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                报告
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming" className="space-y-3">
              {processingItems.map((item) => (
                <ProcessingCard key={item.id} text={item.text} />
              ))}
              {upcomingItems.length === 0 && processingItems.length === 0 ? (
                <div className="text-center py-12">
                  <CalendarDays className="h-16 w-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">暂无即将发生的事项</p>
                </div>
              ) : (
                upcomingItems.map((item) => (
                  <ItemCard key={item.id} item={item} onUpdate={loadData} />
                ))
              )}
            </TabsContent>

            <TabsContent value="todos" className="space-y-3">
              {todoItems.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle2 className="h-16 w-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">待办清单为空</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                    添加任务开始管理你的待办事项
                  </p>
                </div>
              ) : (
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                        我的待办清单
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <span>共 {todoItems.length} 个任务</span>
                        {todoItems.filter(item => item.priority === 'high').length > 0 && 
                          <span className="text-red-600 dark:text-red-400">
                            {todoItems.filter(item => item.priority === 'high').length} 个高优先级
                          </span>
                        }
                        {todoItems.filter(item => item.status === 'in-progress').length > 0 && 
                          <span className="text-blue-600 dark:text-blue-400">
                            {todoItems.filter(item => item.status === 'in-progress').length} 个进行中
                          </span>
                        }
                        {todoItems.filter(item => item.status === 'blocked').length > 0 && 
                          <span className="text-red-600 dark:text-red-400">
                            {todoItems.filter(item => item.status === 'blocked').length} 个已阻塞
                          </span>
                        }
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {todoItems.map((item) => (
                      <TodoCard key={item.id} item={item} onUpdate={loadData} />
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="inbox" className="space-y-3">
              {inboxItems.length === 0 ? (
                <div className="text-center py-12">
                  <Inbox className="h-16 w-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">笔记本为空</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                    记录想法、知识和灵感
                  </p>
                </div>
              ) : (
                <div>
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                      我的笔记
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      共 {inboxItems.length} 条记录性内容
                    </p>
                  </div>
                  <div className="space-y-3">
                    {inboxItems.map((item) => (
                      <ItemCard key={item.id} item={item} onUpdate={loadData} />
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="links" className="space-y-3">
              {urlItems.length === 0 ? (
                <div className="text-center py-12">
                  <LinkIcon className="h-16 w-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">链接库为空</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                    输入URL链接,自动抓取网页内容并生成梗概
                  </p>
                </div>
              ) : (
                <div>
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                      我的链接库
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      共 {urlItems.length} 个链接
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    {urlItems.map((item) => (
                      <URLCard key={item.id} item={item} onDelete={handleDeleteURL} />
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="archived" className="space-y-3">
              {archivedItems.length === 0 ? (
                <div className="text-center py-12">
                  <Archive className="h-16 w-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">归档箱为空</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                    已归档的内容会出现在这里
                  </p>
                </div>
              ) : (
                <div>
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                      已归档的内容
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      共 {archivedItems.length} 条记录，点击可恢复
                    </p>
                  </div>
                  <div className="space-y-3">
                    {archivedItems.map((item) => (
                      item.type === 'url' ? (
                        <URLCard key={item.id} item={item} onDelete={handleDeleteURL} />
                      ) : (
                        <ItemCard key={item.id} item={item} onUpdate={loadData} />
                      )
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="topics">
              {selectedTag ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      标签: {selectedTag}
                    </h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedTag(null)}
                    >
                      返回
                    </Button>
                  </div>
                  {tagItems.length === 0 ? (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                      该标签下暂无条目
                    </p>
                  ) : (
                    tagItems.map((item) => (
                      item.type === 'url' ? (
                        <URLCard key={item.id} item={item} onDelete={handleDeleteURL} />
                      ) : (
                        <ItemCard key={item.id} item={item} onUpdate={loadData} />
                      )
                    ))
                  )}
                </div>
              ) : (
                <div>
                  {/* 二级Tab导航 */}
                  <Tabs value={topicsSubTab} onValueChange={setTopicsSubTab} className="mb-4">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="tags" className="flex items-center gap-2">
                        <Tag className="h-4 w-4" />
                        标签
                      </TabsTrigger>
                      <TabsTrigger value="history" className="flex items-center gap-2">
                        <History className="h-4 w-4" />
                        历史记录
                      </TabsTrigger>
                      <TabsTrigger value="calendar" className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        日历
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="tags" className="mt-6">
                      {tagStats.length === 0 ? (
                        <div className="text-center py-12">
                          <Tag className="h-16 w-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                          <p className="text-gray-500 dark:text-gray-400">暂无标签</p>
                          <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                            开始输入信息,AI会自动生成标签
                          </p>
                        </div>
                      ) : (
                        <div>
                          <div className="mb-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                              标签统计
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              共 {tagStats.length} 个标签,点击查看详情
                            </p>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {tagStats.map((stats) => (
                              <TagCard
                                key={stats.tag}
                                tagStats={stats}
                                onClick={() => handleTagClick(stats.tag)}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="history" className="mt-6">
                      {historyItems.length === 0 ? (
                        <div className="text-center py-12">
                          <History className="h-16 w-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                          <p className="text-gray-500 dark:text-gray-400">暂无历史记录</p>
                        </div>
                      ) : (
                        <div>
                          <div className="mb-6">
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                                  全部历史记录
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  共 {filteredHistoryItems.length > 0 ? filteredHistoryItems.length : historyItems.length} 条记录,按时间倒序排列
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button variant="outline" size="sm" className="gap-2">
                                      <Filter className="h-4 w-4" />
                                      {historyDateRange ? '已筛选' : '按日期筛选'}
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-4" align="end">
                                    <div className="space-y-3">
                                      <div className="space-y-2">
                                        <label className="text-sm font-medium">开始日期</label>
                                        <Input
                                          type="date"
                                          value={historyDateRange?.start || ''}
                                          onChange={(e) => {
                                            const start = e.target.value;
                                            setHistoryDateRange(prev => ({
                                              start,
                                              end: prev?.end || start
                                            }));
                                          }}
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <label className="text-sm font-medium">结束日期</label>
                                        <Input
                                          type="date"
                                          value={historyDateRange?.end || ''}
                                          onChange={(e) => {
                                            const end = e.target.value;
                                            setHistoryDateRange(prev => ({
                                              start: prev?.start || end,
                                              end
                                            }));
                                          }}
                                        />
                                      </div>
                                      <Button
                                        size="sm"
                                        className="w-full"
                                        onClick={async () => {
                                          if (historyDateRange?.start && historyDateRange?.end) {
                                            // @ts-ignore - 新方法 TypeScript 还未识别
                                            const filtered = await itemApi.getHistoryByDateRange(
                                              historyDateRange.start,
                                              historyDateRange.end
                                            );
                                            setFilteredHistoryItems(filtered);
                                          }
                                        }}
                                        disabled={!historyDateRange?.start || !historyDateRange?.end}
                                      >
                                        应用筛选
                                      </Button>
                                    </div>
                                  </PopoverContent>
                                </Popover>
                                {historyDateRange && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setHistoryDateRange(null);
                                      setFilteredHistoryItems([]);
                                    }}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="space-y-3">
                            {(filteredHistoryItems.length > 0 ? filteredHistoryItems : historyItems).map((item) => (
                              item.type === 'url' ? (
                                <URLCard key={item.id} item={item} onDelete={handleDeleteURL} />
                              ) : (
                                <ItemCard key={item.id} item={item} onUpdate={loadData} />
                              )
                            ))}
                          </div>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="calendar" className="mt-6">
                      <CalendarView onUpdate={loadData} />
                    </TabsContent>
                  </Tabs>
                </div>
              )}
            </TabsContent>

            <TabsContent value="report">
              <ReportView />
            </TabsContent>
          </Tabs>
        )}
      </div>

      <QuickInput 
        onItemCreated={loadData}
        onProcessingStart={handleProcessingStart}
        onProcessingComplete={handleProcessingComplete}
        onProcessingError={handleProcessingError}
        onDeleteURL={handleDeleteURL}
      />
    </div>
  );
}
