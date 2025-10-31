import { supabase } from './supabase';
import type { Profile, Item, ItemType, TagStats } from '@/types/types';

export const profileApi = {
  async getCurrentProfile(): Promise<Profile | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      console.error('获取用户信息失败:', error);
      return null;
    }

    return data;
  },

  async getAllProfiles(): Promise<Profile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('获取用户列表失败:', error);
      return [];
    }

    return Array.isArray(data) ? data : [];
  },

  async updateProfile(id: string, updates: Partial<Profile>): Promise<boolean> {
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.error('更新用户信息失败:', error);
      return false;
    }

    return true;
  }
};

export const itemApi = {
  async createItem(item: Omit<Item, 'id' | 'created_at' | 'updated_at'>): Promise<Item | null> {
    const { data, error } = await supabase
      .from('items')
      .insert([item])
      .select()
      .maybeSingle();

    if (error) {
      console.error('创建条目失败:', error);
      return null;
    }

    return data;
  },

  async getItems(filters?: {
    type?: ItemType;
    status?: string;
    tag?: string;
  }): Promise<Item[]> {
    let query = supabase
      .from('items')
      .select('*')
      .is('archived_at', null);

    if (filters?.type) {
      query = query.eq('type', filters.type);
    }

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.tag) {
      query = query.contains('tags', [filters.tag]);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('获取条目列表失败:', error);
      return [];
    }

    return Array.isArray(data) ? data : [];
  },

  async getTodayItems(): Promise<Item[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    console.log('📅 今日视图查询条件:', {
      today: today.toISOString(),
      tomorrow: tomorrow.toISOString(),
      todayLocal: today.toLocaleString('zh-CN'),
      tomorrowLocal: tomorrow.toLocaleString('zh-CN')
    });

    // 查询今天有截止日期的任务和事件
    const { data: withDueDate, error: error1 } = await supabase
      .from('items')
      .select('*')
      .is('archived_at', null)
      .in('type', ['task', 'event'])
      .gte('due_date', today.toISOString())
      .lt('due_date', tomorrow.toISOString())
      .order('due_date', { ascending: true });

    if (error1) {
      console.error('获取今日有截止日期的条目失败:', error1);
    }

    // 查询今天创建但没有截止日期的任务和事件
    const { data: withoutDueDate, error: error2 } = await supabase
      .from('items')
      .select('*')
      .is('archived_at', null)
      .in('type', ['task', 'event'])
      .is('due_date', null)
      .gte('created_at', today.toISOString())
      .lt('created_at', tomorrow.toISOString())
      .order('created_at', { ascending: true });

    if (error2) {
      console.error('获取今日创建无截止日期的条目失败:', error2);
    }

    // 查询过期但未完成的任务
    const { data: overdueItems, error: error3 } = await supabase
      .from('items')
      .select('*')
      .is('archived_at', null)
      .eq('type', 'task')
      .eq('status', 'pending')
      .lt('due_date', today.toISOString())
      .not('due_date', 'is', null)
      .order('due_date', { ascending: true });

    if (error3) {
      console.error('获取过期任务失败:', error3);
    }

    const allItems = [
      ...(Array.isArray(withDueDate) ? withDueDate : []),
      ...(Array.isArray(withoutDueDate) ? withoutDueDate : []),
      ...(Array.isArray(overdueItems) ? overdueItems : [])
    ];

    // 去重（使用id）
    const uniqueItems = Array.from(
      new Map(allItems.map(item => [item.id, item])).values()
    );

    console.log('📅 今日视图结果:', {
      withDueDate: withDueDate?.length || 0,
      withoutDueDate: withoutDueDate?.length || 0,
      overdueItems: overdueItems?.length || 0,
      total: uniqueItems.length,
      items: uniqueItems.map(item => ({
        id: item.id,
        title: item.title,
        type: item.type,
        due_date: item.due_date,
        created_at: item.created_at
      }))
    });

    return uniqueItems;
  },

  async getUpcomingItems(): Promise<Item[]> {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    console.log('📆 即将发生视图查询条件:', {
      tomorrow: tomorrow.toISOString(),
      tomorrowLocal: tomorrow.toLocaleString('zh-CN')
    });

    const { data, error } = await supabase
      .from('items')
      .select('*')
      .is('archived_at', null)
      .in('type', ['task', 'event'])
      .gte('due_date', tomorrow.toISOString())
      .order('due_date', { ascending: true });

    if (error) {
      console.error('获取即将发生条目失败:', error);
      return [];
    }

    const items = Array.isArray(data) ? data : [];
    
    console.log('📆 即将发生视图结果:', {
      total: items.length,
      items: items.slice(0, 5).map(item => ({
        id: item.id,
        title: item.title,
        type: item.type,
        due_date: item.due_date
      }))
    });

    return items;
  },

  async getInboxItems(): Promise<Item[]> {
    console.log('📥 收件箱视图查询...');

    // 查询note和data类型的条目
    const { data: noteData, error: error1 } = await supabase
      .from('items')
      .select('*')
      .is('archived_at', null)
      .in('type', ['note', 'data'])
      .order('created_at', { ascending: false });

    if (error1) {
      console.error('获取note/data类型条目失败:', error1);
    }

    // 查询没有截止日期的task和event（这些可能是AI未能识别时间的条目）
    const { data: noDateItems, error: error2 } = await supabase
      .from('items')
      .select('*')
      .is('archived_at', null)
      .in('type', ['task', 'event'])
      .is('due_date', null)
      .order('created_at', { ascending: false });

    if (error2) {
      console.error('获取无截止日期的task/event失败:', error2);
    }

    const allItems = [
      ...(Array.isArray(noteData) ? noteData : []),
      ...(Array.isArray(noDateItems) ? noDateItems : [])
    ];

    // 按创建时间排序
    allItems.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    console.log('📥 收件箱视图结果:', {
      noteData: noteData?.length || 0,
      noDateItems: noDateItems?.length || 0,
      total: allItems.length,
      items: allItems.slice(0, 5).map(item => ({
        id: item.id,
        title: item.title,
        type: item.type,
        due_date: item.due_date,
        created_at: item.created_at
      }))
    });

    return allItems;
  },

  async getAllTags(): Promise<string[]> {
    const { data, error } = await supabase
      .from('items')
      .select('tags')
      .is('archived_at', null);

    if (error) {
      console.error('获取标签列表失败:', error);
      return [];
    }

    if (!Array.isArray(data)) return [];

    const tagsSet = new Set<string>();
    data.forEach(item => {
      if (Array.isArray(item.tags)) {
        item.tags.forEach(tag => tagsSet.add(tag));
      }
    });

    return Array.from(tagsSet).sort();
  },

  async getTagStats(): Promise<TagStats[]> {
    const { data, error } = await supabase
      .from('items')
      .select('tags, created_at')
      .is('archived_at', null);

    if (error) {
      console.error('获取标签统计失败:', error);
      return [];
    }

    if (!Array.isArray(data)) return [];

    const tagMap = new Map<string, { count: number; lastUsed: string }>();
    
    data.forEach(item => {
      if (Array.isArray(item.tags)) {
        item.tags.forEach(tag => {
          const existing = tagMap.get(tag);
          if (existing) {
            existing.count++;
            if (item.created_at > existing.lastUsed) {
              existing.lastUsed = item.created_at;
            }
          } else {
            tagMap.set(tag, {
              count: 1,
              lastUsed: item.created_at
            });
          }
        });
      }
    });

    const tagStats: TagStats[] = Array.from(tagMap.entries()).map(([tag, stats]) => ({
      tag,
      count: stats.count,
      lastUsed: stats.lastUsed
    }));

    return tagStats.sort((a, b) => b.count - a.count);
  },

  async updateItem(id: string, updates: Partial<Item>): Promise<boolean> {
    const { error } = await supabase
      .from('items')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.error('更新条目失败:', error);
      return false;
    }

    return true;
  },

  async deleteItem(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('items')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('删除条目失败:', error);
      return false;
    }

    return true;
  },

  async archiveItem(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('items')
      .update({ archived_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('归档条目失败:', error);
      return false;
    }

    return true;
  },

  async searchItems(query: string): Promise<Item[]> {
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .is('archived_at', null)
      .or(`title.ilike.%${query}%,description.ilike.%${query}%,raw_text.ilike.%${query}%,url_summary.ilike.%${query}%`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('搜索条目失败:', error);
      return [];
    }

    return Array.isArray(data) ? data : [];
  },

  async getURLItems(): Promise<Item[]> {
    console.log('📎 链接库视图查询...');

    const { data, error } = await supabase
      .from('items')
      .select('*')
      .is('archived_at', null)
      .eq('type', 'url')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('获取链接库条目失败:', error);
      return [];
    }

    const items = Array.isArray(data) ? data : [];

    console.log('📎 链接库视图结果:', {
      total: items.length,
      items: items.slice(0, 5).map(item => ({
        id: item.id,
        title: item.url_title,
        url: item.url,
        created_at: item.created_at
      }))
    });

    return items;
  },

  async getItemsByTag(tag: string): Promise<Item[]> {
    console.log('🏷️ 按标签查询条目:', tag);

    const { data, error } = await supabase
      .from('items')
      .select('*')
      .is('archived_at', null)
      .contains('tags', [tag])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('按标签查询条目失败:', error);
      return [];
    }

    const items = Array.isArray(data) ? data : [];

    console.log('🏷️ 标签查询结果:', {
      tag,
      total: items.length
    });

    return items;
  },

  async getAllItemsHistory(): Promise<Item[]> {
    console.log('📜 历史记录查询...');

    const { data, error } = await supabase
      .from('items')
      .select('*')
      .is('archived_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('获取历史记录失败:', error);
      return [];
    }

    const items = Array.isArray(data) ? data : [];

    console.log('📜 历史记录结果:', {
      total: items.length
    });

    return items;
  },

  async queryItems(intent: any): Promise<Item[]> {
    console.log('🔍 智能查询:', intent);

    let query = supabase
      .from('items')
      .select('*')
      .is('archived_at', null);

    // 按类型筛选
    if (intent.itemType) {
      query = query.eq('type', intent.itemType);
    }

    // 按时间范围筛选
    if (intent.timeRange) {
      if (intent.queryType === 'today' || intent.queryType === 'upcoming') {
        // 查询due_date在范围内的
        query = query
          .gte('due_date', intent.timeRange.start)
          .lte('due_date', intent.timeRange.end);
      } else {
        // 查询created_at在范围内的
        query = query
          .gte('created_at', intent.timeRange.start)
          .lte('created_at', intent.timeRange.end);
      }
    }

    // 按标签筛选
    if (intent.tags && intent.tags.length > 0) {
      query = query.overlaps('tags', intent.tags);
    }

    // 按关键词搜索
    if (intent.keywords && intent.keywords.length > 0) {
      const keyword = intent.keywords[0];
      query = query.or(
        `title.ilike.%${keyword}%,description.ilike.%${keyword}%,raw_text.ilike.%${keyword}%,url_summary.ilike.%${keyword}%`
      );
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('智能查询失败:', error);
      return [];
    }

    const items = Array.isArray(data) ? data : [];

    console.log('🔍 查询结果:', {
      total: items.length,
      intent: intent.queryType
    });

    return items;
  }
};
