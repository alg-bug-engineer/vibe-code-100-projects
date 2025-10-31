import { sendChatStream } from './ai';
import type { QueryIntent, ItemType } from '@/types/types';
import { startOfDay, endOfDay, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

/**
 * 检测输入是否为查询意图
 * 只支持特殊前缀: ? 或 /q
 * 其他所有输入都视为普通记录
 */
export function detectQueryIntent(text: string): boolean {
  const trimmed = text.trim();
  
  // 只检查特殊前缀
  return trimmed.startsWith('?') || trimmed.startsWith('/q');
}

/**
 * 移除查询前缀
 */
export function removeQueryPrefix(text: string): string {
  const trimmed = text.trim();
  if (trimmed.startsWith('?')) {
    return trimmed.substring(1).trim();
  }
  if (trimmed.startsWith('/q')) {
    return trimmed.substring(2).trim();
  }
  return trimmed;
}

/**
 * 使用AI解析查询意图
 */
export async function parseQueryIntent(text: string): Promise<QueryIntent> {
  return new Promise((resolve, reject) => {
    let fullResponse = '';
    
    const systemPrompt = `你是一个智能查询解析助手。用户会输入查询语句,你需要分析并返回JSON格式的查询意图。

查询类型:
- today: 今天的事项
- upcoming: 即将发生的事项
- week: 本周的事项
- month: 本月的事项
- type: 按类型查询(task/event/note/data/url)
- tag: 按标签查询
- general: 通用关键词查询

时间识别:
- "今天" -> today
- "明天" -> tomorrow
- "本周"/"这周" -> week
- "下周" -> next_week
- "本月"/"这个月" -> month

类型识别:
- "任务" -> task
- "日程"/"会议"/"活动" -> event
- "笔记"/"想法" -> note
- "资料"/"信息" -> data
- "链接"/"网址" -> url

返回格式(纯JSON,不要markdown代码块):
{
  "isQuery": true,
  "queryType": "today",
  "timeRange": {
    "start": "2025-10-27T00:00:00",
    "end": "2025-10-27T23:59:59"
  },
  "itemType": "event",
  "tags": ["工作"],
  "keywords": ["会议"]
}`;

    sendChatStream({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text }
      ],
      onUpdate: (content: string) => {
        fullResponse = content;
      },
      onComplete: () => {
        try {
          let jsonStr = fullResponse.trim();
          if (jsonStr.startsWith('```json')) {
            jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');
          } else if (jsonStr.startsWith('```')) {
            jsonStr = jsonStr.replace(/```\n?/g, '');
          }
          
          const result = JSON.parse(jsonStr);
          
          // 处理时间范围
          if (result.queryType && !result.timeRange) {
            result.timeRange = calculateTimeRange(result.queryType);
          }
          
          resolve(result as QueryIntent);
        } catch (error) {
          console.error('解析查询意图失败:', error, fullResponse);
          // 返回通用查询
          resolve({
            isQuery: true,
            queryType: 'general',
            keywords: [text]
          });
        }
      },
      onError: (error: Error) => {
        console.error('AI查询解析失败:', error);
        reject(error);
      }
    });
  });
}

/**
 * 计算时间范围
 */
function calculateTimeRange(queryType: string): { start: string; end: string } | undefined {
  const now = new Date();
  
  switch (queryType) {
    case 'today':
      return {
        start: startOfDay(now).toISOString(),
        end: endOfDay(now).toISOString()
      };
    
    case 'tomorrow':
      const tomorrow = addDays(now, 1);
      return {
        start: startOfDay(tomorrow).toISOString(),
        end: endOfDay(tomorrow).toISOString()
      };
    
    case 'week':
      return {
        start: startOfWeek(now, { weekStartsOn: 1 }).toISOString(),
        end: endOfWeek(now, { weekStartsOn: 1 }).toISOString()
      };
    
    case 'next_week':
      const nextWeek = addDays(now, 7);
      return {
        start: startOfWeek(nextWeek, { weekStartsOn: 1 }).toISOString(),
        end: endOfWeek(nextWeek, { weekStartsOn: 1 }).toISOString()
      };
    
    case 'month':
      return {
        start: startOfMonth(now).toISOString(),
        end: endOfMonth(now).toISOString()
      };
    
    default:
      return undefined;
  }
}

/**
 * 生成查询摘要
 */
export function generateQuerySummary(intent: QueryIntent, count: number): string {
  const parts: string[] = [];
  
  if (intent.queryType === 'today') {
    parts.push('今天');
  } else if (intent.queryType === 'upcoming') {
    parts.push('即将发生');
  } else if (intent.queryType === 'week') {
    parts.push('本周');
  } else if (intent.queryType === 'month') {
    parts.push('本月');
  }
  
  if (intent.itemType) {
    const typeNames: Record<ItemType, string> = {
      task: '任务',
      event: '日程',
      note: '笔记',
      data: '资料',
      url: '链接'
    };
    parts.push(typeNames[intent.itemType]);
  }
  
  if (intent.tags && intent.tags.length > 0) {
    parts.push(`标签: ${intent.tags.join(', ')}`);
  }
  
  const prefix = parts.length > 0 ? parts.join('的') : '查询结果';
  return `${prefix}: 共找到 ${count} 条记录`;
}
