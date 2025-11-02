import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Search } from 'lucide-react';
import { toast } from 'sonner';
import { processTextWithAI } from '@/utils/ai';
import { detectURL, isMainlyURL, fetchURLContent } from '@/utils/urlProcessor';
import { detectQueryIntent, removeQueryPrefix, parseQueryIntent, generateQuerySummary } from '@/utils/queryProcessor';
import { itemApi, auth, templateApi } from '@/db/api';
import { QueryResultPanel } from '@/components/query/QueryResultPanel';
import { TemplateInputModal } from './TemplateInputModal';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import type { Item, UserTemplate } from '@/types/types';

interface QuickInputProps {
  onItemCreated?: () => void;
  onProcessingStart?: (text: string, id: string) => void;
  onProcessingComplete?: (id: string) => void;
  onProcessingError?: (id: string) => void;
  onDeleteURL?: (id: string) => void;
}

export default function QuickInput({ 
  onItemCreated, 
  onProcessingStart,
  onProcessingComplete,
  onProcessingError,
  onDeleteURL
}: QuickInputProps) {
  const [text, setText] = useState('');
  const [isQuerying, setIsQuerying] = useState(false);
  const [queryResults, setQueryResults] = useState<Item[] | null>(null);
  const [querySummary, setQuerySummary] = useState('');
  
  // 模板相关状态
  const [showTemplateMenu, setShowTemplateMenu] = useState(false);
  const [templates, setTemplates] = useState<UserTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<UserTemplate | null>(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  // 加载用户模板
  useEffect(() => {
    loadTemplates();
  }, []);

  const getDefaultTemplates = (): UserTemplate[] => {
    return [
      {
        id: 'default-template-1',
        user_id: '',
        trigger_word: '日报',
        template_name: '每日工作日志',
        icon: '📰',
        collection_type: '日报',
        default_tags: ['工作', '日报'],
        default_sub_items: [
          { id: '1', text: '总结今日完成的工作', status: 'pending' },
          { id: '2', text: '记录遇到的问题', status: 'pending' },
          { id: '3', text: '规划明日工作计划', status: 'pending' },
        ],
        is_active: true,
        sort_order: 0,
        usage_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'default-template-2',
        user_id: '',
        trigger_word: '会议',
        template_name: '会议纪要',
        icon: '👥',
        collection_type: '会议',
        default_tags: ['会议', '工作'],
        default_sub_items: [
          { id: '1', text: '记录会议议题', status: 'pending' },
          { id: '2', text: '记录讨论要点', status: 'pending' },
          { id: '3', text: '记录行动项', status: 'pending' },
        ],
        is_active: true,
        sort_order: 1,
        usage_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'default-template-3',
        user_id: '',
        trigger_word: '月报',
        template_name: '月度总结',
        icon: '📅',
        collection_type: '月报',
        default_tags: ['工作', '月报'],
        default_sub_items: [
          { id: '1', text: '本月工作完成情况', status: 'pending' },
          { id: '2', text: '重点成果与亮点', status: 'pending' },
          { id: '3', text: '下月工作计划', status: 'pending' },
        ],
        is_active: true,
        sort_order: 2,
        usage_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];
  };

  const loadTemplates = async () => {
    try {
      // 从 API 获取用户模板
      const userTemplates = await templateApi.getAll();
      
      // 如果没有模板，使用默认模板
      if (userTemplates.length === 0) {
        console.log('📝 没有用户模板，使用默认模板');
        setTemplates(getDefaultTemplates());
      } else {
        console.log('✅ 加载了', userTemplates.length, '个用户模板');
        setTemplates(userTemplates);
      }
    } catch (error) {
      console.error('❌ 加载模板失败:', error);
      // 如果加载失败，使用默认模板
      toast.error('加载模板失败，使用默认模板');
      setTemplates(getDefaultTemplates());
    }
  };

  const handleTextChange = (value: string) => {
    setText(value);
    
    // 检测是否输入了 /
    if (value === '/') {
      setShowTemplateMenu(true);
    } else if (value.startsWith('/')) {
      // 继续显示菜单，用于过滤
      setShowTemplateMenu(true);
    } else {
      setShowTemplateMenu(false);
    }
  };

  const handleTemplateSelect = (template: UserTemplate) => {
    setSelectedTemplate(template);
    setShowTemplateMenu(false);
    setShowTemplateModal(true);
    setText(''); // 清空输入框
  };

  const handleTemplateSave = async (data: {
    title: string;
    description: string;
    sub_items: any[];
    tags: string[];
  }) => {
    if (!selectedTemplate) return;

    const processingId = `processing-${Date.now()}`;
    
    try {
      const user = auth.getCurrentUser();
      if (!user) {
        toast.error('用户未初始化');
        return;
      }

      onProcessingStart?.(data.title, processingId);

      // 创建集合类型的条目
      const newItem = await itemApi.createItem({
        raw_text: data.title,
        type: 'collection',
        title: data.title,
        description: data.description,
        due_date: null,
        priority: 'medium',
        status: 'pending',
        tags: data.tags,
        entities: {},
        archived_at: null,
        url: null,
        url_title: null,
        url_summary: null,
        url_thumbnail: null,
        url_fetched_at: null,
        has_conflict: false,
        start_time: null,
        end_time: null,
        recurrence_rule: null,
        recurrence_end_date: null,
        master_item_id: null,
        is_master: false,
        collection_type: selectedTemplate.collection_type,
        sub_items: data.sub_items,
      });

      if (newItem) {
        console.log('✅ 集合条目创建成功:', newItem);
        toast.success('已添加到智能仪表盘');
        onProcessingComplete?.(processingId);
        onItemCreated?.();
        
        // 更新模板使用次数
        try {
          await templateApi.incrementUsage(selectedTemplate.id);
        } catch (err) {
          console.warn('更新模板使用次数失败:', err);
        }
      } else {
        console.error('❌ 创建条目返回 null');
        toast.error('创建失败,请重试');
        onProcessingError?.(processingId);
      }
    } catch (error) {
      console.error('保存失败:', error);
      toast.error('保存失败,请重试');
      onProcessingError?.(processingId);
    }
  };

  const handleSubmit = async () => {
    if (!text.trim()) {
      toast.error('请输入内容');
      return;
    }

    const inputText = text.trim();
    
    // 检测是否为查询意图
    const isQuery = detectQueryIntent(inputText);
    
    if (isQuery) {
      // 处理查询
      await handleQuery(inputText);
    } else {
      // 处理普通输入
      await handleNormalInput(inputText);
    }
  };

  const handleQuery = async (inputText: string) => {
    setIsQuerying(true);
    setText(''); // 清空输入框
    
    try {
      // 移除查询前缀
      const queryText = removeQueryPrefix(inputText);
      
      toast.info('正在解析查询...');
      
      // 使用AI解析查询意图
      const intent = await parseQueryIntent(queryText);
      
      console.log('🔍 查询意图:', intent);
      
      // 执行查询
      const results = await itemApi.queryItems(intent);
      
      // 生成摘要
      const summary = generateQuerySummary(intent, results.length);
      
      setQueryResults(results);
      setQuerySummary(summary);
      
      toast.success(`找到 ${results.length} 条记录`);
    } catch (error) {
      console.error('查询失败:', error);
      toast.error('查询失败,请重试');
    } finally {
      setIsQuerying(false);
    }
  };

  const handleNormalInput = async (inputText: string) => {
    const processingId = `processing-${Date.now()}`;
    
    // 立即清空输入框,让用户可以继续输入
    setText('');
    
    // 通知父组件开始处理
    onProcessingStart?.(inputText, processingId);

    // 异步处理,不阻塞UI
    try {
      const user = auth.getCurrentUser();
      if (!user) {
        toast.error('用户未初始化');
        onProcessingError?.(processingId);
        return;
      }

      // 检测是否为URL
      const detectedURL = detectURL(inputText);
      const isURL = detectedURL && isMainlyURL(inputText);

      if (isURL && detectedURL) {
        // 处理URL类型
        console.log('🔗 检测到URL,开始抓取内容...');
        toast.info('正在抓取网页内容...');

        try {
          const urlResult = await fetchURLContent(detectedURL);

          // 创建URL类型的条目
          const newItem = await itemApi.createItem({
            raw_text: inputText,
            type: 'url',
            title: urlResult.title,
            description: urlResult.summary,
            due_date: null,
            priority: 'medium',
            status: 'pending',
            tags: ['链接', '网页'],
            entities: {},
            archived_at: null,
            url: urlResult.url,
            url_title: urlResult.title,
            url_summary: urlResult.summary,
            url_thumbnail: urlResult.thumbnail || null,
            url_fetched_at: new Date().toISOString(),
            has_conflict: false,
            start_time: null,
            end_time: null,
            recurrence_rule: null,
            recurrence_end_date: null,
            master_item_id: null,
            is_master: false
          });

          if (newItem) {
            toast.success('链接已保存到链接库');
            onProcessingComplete?.(processingId);
            onItemCreated?.();
          } else {
            toast.error('保存失败,请重试');
            onProcessingError?.(processingId);
          }
        } catch (error) {
          console.error('URL处理失败:', error);
          toast.error('抓取网页内容失败,请检查URL是否有效');
          onProcessingError?.(processingId);
        }
      } else {
        // 普通文本,使用AI处理
        const aiResult = await processTextWithAI(inputText);

        // 确保类型不为空，默认使用 'task'
        const itemType = aiResult.type || 'task';

        // 创建条目
        const newItem = await itemApi.createItem({
          raw_text: inputText,
          type: itemType,
          title: aiResult.title,
          description: aiResult.description,
          due_date: aiResult.due_date,
          priority: aiResult.priority,
          status: 'pending',
          tags: aiResult.tags,
          entities: aiResult.entities,
          archived_at: null,
          url: null,
          url_title: null,
          url_summary: null,
          url_thumbnail: null,
          url_fetched_at: null,
          has_conflict: false,
          start_time: aiResult.start_time || null,
          end_time: aiResult.end_time || null,
          recurrence_rule: null,
          recurrence_end_date: null,
          master_item_id: null,
          is_master: false
        });

        if (newItem) {
          console.log('✅ 普通文本条目创建成功:', newItem);
          toast.success('已添加到智能仪表盘');
          onProcessingComplete?.(processingId);
          onItemCreated?.();
          console.log('🔄 已调用数据刷新回调');
        } else {
          console.error('❌ 创建条目返回 null');
          toast.error('创建失败,请重试');
          onProcessingError?.(processingId);
        }
      }
    } catch (error) {
      console.error('处理失败:', error);
      toast.error('处理失败,请重试');
      onProcessingError?.(processingId);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleCloseQuery = () => {
    setQueryResults(null);
    setQuerySummary('');
  };

  const isQueryMode = text.trim().startsWith('?') || text.trim().startsWith('/q');

  return (
    <>
      {/* 查询结果浮层 */}
      {queryResults && (
        <QueryResultPanel
          items={queryResults}
          summary={querySummary}
          onClose={handleCloseQuery}
          onUpdate={onItemCreated}
          onDeleteURL={onDeleteURL}
        />
      )}

      {/* 模板输入模态框 */}
      {selectedTemplate && (
        <TemplateInputModal
          open={showTemplateModal}
          onOpenChange={setShowTemplateModal}
          template={selectedTemplate}
          onSave={handleTemplateSave}
        />
      )}

      {/* 输入框 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 p-4 shadow-lg z-50">
        <div className="max-w-4xl mx-auto">
          {/* 模板菜单 */}
          {showTemplateMenu && (
            <div className="mb-2 bg-white dark:bg-gray-800 border rounded-lg shadow-lg overflow-hidden">
              <Command className="rounded-lg border-0">
                <CommandInput placeholder="搜索模板..." />
                <CommandList>
                  <CommandEmpty>未找到模板</CommandEmpty>
                  <CommandGroup heading="智能模板">
                    {templates
                      .filter((t) => t.is_active)
                      .map((template) => (
                        <CommandItem
                          key={template.id}
                          onSelect={() => handleTemplateSelect(template)}
                          className="cursor-pointer"
                        >
                          <span className="mr-2">{template.icon}</span>
                          <span className="font-medium">
                            /{template.trigger_word}
                          </span>
                          <span className="ml-2 text-muted-foreground">
                            {template.template_name}
                          </span>
                        </CommandItem>
                      ))}
                  </CommandGroup>
                  <CommandGroup>
                    <CommandItem className="cursor-pointer text-muted-foreground">
                      <span className="mr-2">⚙️</span>
                      管理模板...
                    </CommandItem>
                  </CommandGroup>
                </CommandList>
              </Command>
            </div>
          )}
          
          <div className="flex gap-2">
            <Textarea
              value={text}
              onChange={(e) => handleTextChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isQueryMode 
                  ? "🔍 查询模式: 输入查询内容 (如: 今天有什么事? 查询本周的会议)" 
                  : "输入任何想法、任务、日程或URL链接... (输入 / 使用智能模板, ? 或 /q 开启查询模式, Enter发送)"
              }
              className={`min-h-[60px] max-h-[120px] resize-none ${
                isQueryMode ? 'border-primary' : ''
              }`}
            />
            <Button
              onClick={handleSubmit}
              disabled={!text.trim() || isQuerying}
              size="lg"
              className="px-6"
            >
              {isQueryMode ? (
                <Search className="h-5 w-5" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
          
          {/* 提示文本 */}
          {isQueryMode && (
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              💡 提示: 可以查询"今天的任务"、"本周的会议"、"标签:工作"等
            </div>
          )}
        </div>
      </div>
    </>
  );
}
