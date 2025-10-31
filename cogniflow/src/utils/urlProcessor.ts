import type { URLFetchResult } from '@/types/types';

// URL正则表达式
const URL_REGEX = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi;

/**
 * 检测文本中是否包含URL
 */
export function detectURL(text: string): string | null {
  const matches = text.match(URL_REGEX);
  return matches ? matches[0] : null;
}

/**
 * 检测文本是否主要是URL(URL占比超过50%)
 */
export function isMainlyURL(text: string): boolean {
  const url = detectURL(text);
  if (!url) return false;
  
  // 如果文本主要是URL(去除空格后URL占比超过50%)
  const trimmedText = text.trim();
  return url.length / trimmedText.length > 0.5;
}

/**
 * 抓取URL内容 (简化版本，不依赖Supabase Edge Function)
 * 由于浏览器CORS限制，只能提取URL基本信息
 */
export async function fetchURLContent(url: string): Promise<URLFetchResult> {
  console.log('🌐 处理URL:', url);
  
  try {
    // 从URL提取基本信息
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    const pathname = urlObj.pathname;
    
    // 生成标题（从URL路径提取）
    let title = hostname;
    if (pathname && pathname !== '/') {
      const pathParts = pathname.split('/').filter(Boolean);
      if (pathParts.length > 0) {
        title = pathParts[pathParts.length - 1]
          .replace(/[-_]/g, ' ')
          .replace(/\.[^.]+$/, '') // 移除文件扩展名
          .replace(/\b\w/g, l => l.toUpperCase()); // 首字母大写
      }
    }
    
    // 如果标题太短或不友好，使用完整域名
    if (title.length < 3) {
      title = hostname;
    }
    
    const result: URLFetchResult = {
      url: url,
      title: title || '网页链接',
      summary: `来自 ${hostname} 的链接`,
      thumbnail: `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`,
      content: ''
    };
    
    console.log('✅ URL信息提取成功:', result.title);
    
    return result;
  } catch (error) {
    console.error('URL处理失败:', error);
    
    // 返回最基本的信息
    return {
      url: url,
      title: '网页链接',
      summary: '无法提取链接信息',
      thumbnail: undefined,
      content: ''
    };
  }
}
