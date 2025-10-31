import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'npm:@supabase/supabase-js@2';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FetchURLRequest {
  url: string;
}

interface FetchURLResponse {
  success: boolean;
  url: string;
  title: string;
  content: string;
  summary: string;
  thumbnail?: string;
  error?: string;
}

// 提取网页标题
function extractTitle(html: string): string {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch && titleMatch[1]) {
    return titleMatch[1].trim();
  }
  
  // 尝试从og:title提取
  const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
  if (ogTitleMatch && ogTitleMatch[1]) {
    return ogTitleMatch[1].trim();
  }
  
  return '未知标题';
}

// 提取缩略图
function extractThumbnail(html: string, baseUrl: string): string | undefined {
  // 尝试从og:image提取
  const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
  if (ogImageMatch && ogImageMatch[1]) {
    const imgUrl = ogImageMatch[1].trim();
    return imgUrl.startsWith('http') ? imgUrl : new URL(imgUrl, baseUrl).href;
  }
  
  // 尝试从twitter:image提取
  const twitterImageMatch = html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i);
  if (twitterImageMatch && twitterImageMatch[1]) {
    const imgUrl = twitterImageMatch[1].trim();
    return imgUrl.startsWith('http') ? imgUrl : new URL(imgUrl, baseUrl).href;
  }
  
  return undefined;
}

// 提取文本内容
function extractTextContent(html: string): string {
  // 移除script和style标签
  let text = html.replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, '');
  text = text.replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, '');
  
  // 移除HTML标签
  text = text.replace(/<[^>]+>/g, ' ');
  
  // 解码HTML实体
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&quot;/g, '"');
  
  // 清理多余空白
  text = text.replace(/\s+/g, ' ').trim();
  
  // 限制长度
  return text.substring(0, 5000);
}

// 使用Gemini生成摘要
async function generateSummary(title: string, content: string): Promise<string> {
  const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
  
  if (!geminiApiKey) {
    console.warn('GEMINI_API_KEY未配置,使用简单摘要');
    return content.substring(0, 200) + '...';
  }
  
  try {
    const prompt = `请为以下网页内容生成一个简洁的中文摘要(100-150字):\n\n标题: ${title}\n\n内容: ${content.substring(0, 2000)}`;
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 300,
          }
        })
      }
    );
    
    if (!response.ok) {
      throw new Error(`Gemini API错误: ${response.status}`);
    }
    
    const data = await response.json();
    const summary = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (summary) {
      return summary.trim();
    }
    
    throw new Error('无法从Gemini响应中提取摘要');
  } catch (error) {
    console.error('生成摘要失败:', error);
    return content.substring(0, 200) + '...';
  }
}

Deno.serve(async (req: Request) => {
  // 处理CORS预检请求
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  try {
    const { url }: FetchURLRequest = await req.json();
    
    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL参数缺失' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // 验证URL格式
    let validUrl: URL;
    try {
      validUrl = new URL(url);
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: 'URL格式无效' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('正在抓取URL:', url);
    
    // 抓取网页内容
    const fetchResponse = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!fetchResponse.ok) {
      throw new Error(`HTTP错误: ${fetchResponse.status}`);
    }
    
    const html = await fetchResponse.text();
    
    // 提取信息
    const title = extractTitle(html);
    const content = extractTextContent(html);
    const thumbnail = extractThumbnail(html, validUrl.origin);
    
    console.log('提取完成 - 标题:', title, '内容长度:', content.length);
    
    // 生成摘要
    const summary = await generateSummary(title, content);
    
    console.log('摘要生成完成');
    
    const response: FetchURLResponse = {
      success: true,
      url,
      title,
      content,
      summary,
      thumbnail
    };
    
    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('抓取URL失败:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
