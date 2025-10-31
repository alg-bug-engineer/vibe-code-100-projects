/**
 * API 层 - 使用 IndexedDB 本地存储
 * 完全替代 Supabase
 */

import { IndexedDBHelper, STORES, generateUUID } from './indexeddb';
import { localAuth } from './localAuth';
import type { Profile, Item, ItemType, TagStats, QueryIntent } from '@/types/types';

/**
 * 用户 API
 */
export const profileApi = {
  /**
   * 获取当前用户信息
   */
  async getCurrentProfile(): Promise<Profile | null> {
    const user = localAuth.getCurrentUser();
    if (!user) return null;

    try {
      const profile = await IndexedDBHelper.getById<Profile>(STORES.PROFILES, user.id);
      return profile;
    } catch (error) {
      console.error('获取用户信息失败:', error);
      return null;
    }
  },

  /**
   * 获取所有用户
   */
  async getAllProfiles(): Promise<Profile[]> {
    try {
      return await IndexedDBHelper.getAll<Profile>(STORES.PROFILES);
    } catch (error) {
      console.error('获取用户列表失败:', error);
      return [];
    }
  },

  /**
   * 更新用户信息
   */
  async updateProfile(id: string, updates: Partial<Profile>): Promise<boolean> {
    try {
      const profile = await IndexedDBHelper.getById<Profile>(STORES.PROFILES, id);
      if (!profile) return false;

      const updatedProfile = { ...profile, ...updates };
      await IndexedDBHelper.update(STORES.PROFILES, updatedProfile);
      return true;
    } catch (error) {
      console.error('更新用户信息失败:', error);
      return false;
    }
  }
};

/**
 * 条目 API
 */
export const itemApi = {
  /**
   * 创建条目
   */
  async createItem(item: Omit<Item, 'id' | 'created_at' | 'updated_at'>): Promise<Item | null> {
    try {
      const newItem: Item = {
        ...item,
        id: generateUUID(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await IndexedDBHelper.add(STORES.ITEMS, newItem);
      return newItem;
    } catch (error) {
      console.error('创建条目失败:', error);
      return null;
    }
  },

  /**
   * 获取条目列表（支持过滤）
   */
  async getItems(filters?: {
    type?: ItemType;
    status?: string;
    tag?: string;
  }): Promise<Item[]> {
    try {
      const user = localAuth.getCurrentUser();
      if (!user) return [];

      const items = await IndexedDBHelper.query<Item>(
        STORES.ITEMS,
        (item) => {
          // 用户过滤
          if (item.user_id !== user.id) return false;
          
          // 未归档
          if (item.archived_at !== null) return false;

          // 类型过滤
          if (filters?.type && item.type !== filters.type) return false;

          // 状态过滤
          if (filters?.status && item.status !== filters.status) return false;

          // 标签过滤
          if (filters?.tag && !item.tags.includes(filters.tag)) return false;

          return true;
        },
        { field: 'created_at', direction: 'desc' }
      );

      return items;
    } catch (error) {
      console.error('获取条目列表失败:', error);
      return [];
    }
  },

  /**
   * 获取今天的条目（今天需要关注的所有事项）
   */
  /**
   * 获取今天的条目
   * 规则：今天创建的所有记录，但排除明确时间不是今天的
   */
  async getTodayItems(): Promise<Item[]> {
    try {
      const user = localAuth.getCurrentUser();
      if (!user) return [];

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayDateOnly = today.toISOString().split('T')[0]; // YYYY-MM-DD

      const items = await IndexedDBHelper.query<Item>(
        STORES.ITEMS,
        (item) => {
          if (item.user_id !== user.id || item.archived_at !== null) return false;
          if (item.status === 'completed') return false; // 排除已完成的
          
          // 只包括有时效性的类型
          if (item.type !== 'task' && item.type !== 'event') return false;
          
          // 必须是今天创建的
          const createdDate = item.created_at.split('T')[0];
          if (createdDate !== todayDateOnly) return false;
          
          // 排除明确时间不是今天的事项
          if (item.due_date) {
            const dueDate = item.due_date.split('T')[0];
            // 如果 due_date 不是今天，则排除
            if (dueDate !== todayDateOnly) return false;
          }
          
          if (item.start_time) {
            const startDate = item.start_time.split('T')[0];
            // 如果 start_time 不是今天，则排除
            if (startDate !== todayDateOnly) return false;
          }
          
          // 其他情况都显示（今天创建且没有时间，或时间就是今天）
          return true;
        },
        { field: 'created_at', direction: 'desc' }
      );

      return items;
    } catch (error) {
      console.error('获取今天的条目失败:', error);
      return [];
    }
  },

  /**
   * 获取即将发生的条目（从当前时刻往后的未来事项，排除已过去的）
   */
  async getUpcomingItems(days: number = 7): Promise<Item[]> {
    try {
      const user = localAuth.getCurrentUser();
      if (!user) return [];

      const now = new Date();
      const nowStr = now.toISOString();
      
      // 计算未来日期
      const future = new Date();
      future.setDate(future.getDate() + days);
      future.setHours(23, 59, 59, 999);
      const futureStr = future.toISOString();

      const items = await IndexedDBHelper.query<Item>(
        STORES.ITEMS,
        (item) => {
          if (item.user_id !== user.id || item.archived_at !== null) return false;
          if (item.status === 'completed') return false;
          
          // 只包括有时效性的类型
          if (item.type !== 'task' && item.type !== 'event') return false;
          
          const dateToCheck = item.due_date || item.start_time;
          if (!dateToCheck) return false;
          
          // 只包括从现在开始到未来的事项（排除已过去的）
          return dateToCheck > nowStr && dateToCheck <= futureStr;
        },
        { field: 'due_date', direction: 'asc' }
      );

      return items;
    } catch (error) {
      console.error('获取即将到期的条目失败:', error);
      return [];
    }
  },

  /**
   * 根据时间范围查询条目
   */
  async getItemsByDateRange(startDate: string, endDate: string): Promise<Item[]> {
    try {
      const user = localAuth.getCurrentUser();
      if (!user) return [];

      const items = await IndexedDBHelper.query<Item>(
        STORES.ITEMS,
        (item) => {
          if (item.user_id !== user.id || item.archived_at !== null) return false;
          
          const dateToCheck = item.due_date || item.start_time;
          if (!dateToCheck) return false;
          
          return dateToCheck >= startDate && dateToCheck <= endDate;
        },
        { field: 'due_date', direction: 'asc' }
      );

      return items;
    } catch (error) {
      console.error('按时间范围查询失败:', error);
      return [];
    }
  },

  /**
   * 搜索条目
   */
  async searchItems(keywords: string[]): Promise<Item[]> {
    try {
      const user = localAuth.getCurrentUser();
      if (!user) return [];

      const items = await IndexedDBHelper.query<Item>(
        STORES.ITEMS,
        (item) => {
          if (item.user_id !== user.id || item.archived_at !== null) return false;
          
          const searchText = [
            item.title,
            item.description,
            item.raw_text,
            ...item.tags
          ].join(' ').toLowerCase();

          return keywords.some(keyword => 
            searchText.includes(keyword.toLowerCase())
          );
        },
        { field: 'created_at', direction: 'desc' }
      );

      return items;
    } catch (error) {
      console.error('搜索失败:', error);
      return [];
    }
  },

  /**
   * 获取单个条目
   */
  async getItem(id: string): Promise<Item | null> {
    try {
      return await IndexedDBHelper.getById<Item>(STORES.ITEMS, id);
    } catch (error) {
      console.error('获取条目失败:', error);
      return null;
    }
  },

  /**
   * 更新条目
   */
  async updateItem(id: string, updates: Partial<Item>): Promise<boolean> {
    try {
      const item = await IndexedDBHelper.getById<Item>(STORES.ITEMS, id);
      if (!item) return false;

      const updatedItem: Item = {
        ...item,
        ...updates,
        updated_at: new Date().toISOString()
      };

      await IndexedDBHelper.update(STORES.ITEMS, updatedItem);
      return true;
    } catch (error) {
      console.error('更新条目失败:', error);
      return false;
    }
  },

  /**
   * 删除条目
   */
  async deleteItem(id: string): Promise<boolean> {
    try {
      await IndexedDBHelper.delete(STORES.ITEMS, id);
      return true;
    } catch (error) {
      console.error('删除条目失败:', error);
      return false;
    }
  },

  /**
   * 归档条目
   */
  async archiveItem(id: string): Promise<boolean> {
    return await this.updateItem(id, {
      archived_at: new Date().toISOString()
    });
  },

  /**
   * 取消归档
   */
  async unarchiveItem(id: string): Promise<boolean> {
    return await this.updateItem(id, {
      archived_at: null
    });
  },

  /**
   * 获取归档的条目
   */
  async getArchivedItems(): Promise<Item[]> {
    try {
      const user = localAuth.getCurrentUser();
      if (!user) return [];

      const items = await IndexedDBHelper.query<Item>(
        STORES.ITEMS,
        (item) => {
          return item.user_id === user.id && item.archived_at !== null;
        },
        { field: 'archived_at', direction: 'desc' }
      );

      return items;
    } catch (error) {
      console.error('获取归档条目失败:', error);
      return [];
    }
  },

  /**
   * 获取统计信息
   */
  async getStats(): Promise<{
    total: number;
    byType: Record<ItemType, number>;
    byStatus: Record<string, number>;
    completed: number;
    pending: number;
  }> {
    try {
      const user = localAuth.getCurrentUser();
      if (!user) {
        return {
          total: 0,
          byType: { task: 0, event: 0, note: 0, data: 0, url: 0 },
          byStatus: {},
          completed: 0,
          pending: 0
        };
      }

      const items = await IndexedDBHelper.query<Item>(
        STORES.ITEMS,
        (item) => item.user_id === user.id && item.archived_at === null
      );

      const stats = {
        total: items.length,
        byType: { task: 0, event: 0, note: 0, data: 0, url: 0 } as Record<ItemType, number>,
        byStatus: {} as Record<string, number>,
        completed: 0,
        pending: 0
      };

      for (const item of items) {
        // 按类型统计
        stats.byType[item.type] = (stats.byType[item.type] || 0) + 1;

        // 按状态统计
        stats.byStatus[item.status] = (stats.byStatus[item.status] || 0) + 1;

        // 完成/待办统计
        if (item.status === 'completed') {
          stats.completed++;
        } else {
          stats.pending++;
        }
      }

      return stats;
    } catch (error) {
      console.error('获取统计信息失败:', error);
      return {
        total: 0,
        byType: { task: 0, event: 0, note: 0, data: 0, url: 0 },
        byStatus: {},
        completed: 0,
        pending: 0
      };
    }
  },

  /**
   * 获取收件箱条目（无日期的待办任务和笔记）
   */
  async getInboxItems(): Promise<Item[]> {
    try {
      const user = localAuth.getCurrentUser();
      if (!user) return [];

      const items = await IndexedDBHelper.query<Item>(
        STORES.ITEMS,
        (item) => 
          item.user_id === user.id &&
          item.archived_at === null &&
          item.due_date === null &&
          (item.type === 'task' || item.type === 'note') &&
          item.status === 'pending'
      );

      return items.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    } catch (error) {
      console.error('获取收件箱条目失败:', error);
      return [];
    }
  },

  /**
   * 获取待办清单（所有未完成的任务，按优先级和状态排序）
   */
  async getTodoItems(): Promise<Item[]> {
    try {
      const user = localAuth.getCurrentUser();
      if (!user) return [];

      const items = await IndexedDBHelper.query<Item>(
        STORES.ITEMS,
        (item) => 
          item.user_id === user.id &&
          item.archived_at === null &&
          item.type === 'task' &&
          item.status !== 'completed'
      );

      // 按优先级和创建时间排序
      return items.sort((a, b) => {
        // 优先级排序: high > medium > low
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 1;
        const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 1;
        
        if (aPriority !== bPriority) {
          return bPriority - aPriority; // 高优先级在前
        }
        
        // 同优先级按创建时间排序
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
    } catch (error) {
      console.error('获取待办清单失败:', error);
      return [];
    }
  },

  /**
   * 获取所有 URL 类型的条目
   */
  async getURLItems(): Promise<Item[]> {
    try {
      const user = localAuth.getCurrentUser();
      if (!user) return [];

      const items = await IndexedDBHelper.query<Item>(
        STORES.ITEMS,
        (item) => 
          item.user_id === user.id &&
          item.archived_at === null &&
          item.type === 'url'
      );

      return items.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    } catch (error) {
      console.error('获取 URL 条目失败:', error);
      return [];
    }
  },

  /**
   * 获取所有条目的历史记录（用于话题视图）
   */
  async getAllItemsHistory(): Promise<Item[]> {
    try {
      const user = localAuth.getCurrentUser();
      if (!user) return [];

      const items = await IndexedDBHelper.query<Item>(
        STORES.ITEMS,
        (item) => item.user_id === user.id && item.archived_at === null
      );

      return items.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    } catch (error) {
      console.error('获取历史记录失败:', error);
      return [];
    }
  },

  /**
   * 获取标签统计信息
   */
  async getTagStats(): Promise<TagStats[]> {
    try {
      const user = localAuth.getCurrentUser();
      if (!user) return [];

      const items = await IndexedDBHelper.query<Item>(
        STORES.ITEMS,
        (item) => item.user_id === user.id && item.archived_at === null
      );

      const tagCounts = new Map<string, { count: number; lastUsed: string }>();

      for (const item of items) {
        for (const tag of item.tags) {
          const existing = tagCounts.get(tag);
          if (!existing || item.created_at > existing.lastUsed) {
            tagCounts.set(tag, {
              count: (existing?.count || 0) + 1,
              lastUsed: item.created_at
            });
          } else {
            tagCounts.set(tag, {
              ...existing,
              count: existing.count + 1
            });
          }
        }
      }

      return Array.from(tagCounts.entries())
        .map(([tag, { count, lastUsed }]) => ({ tag, count, lastUsed }))
        .sort((a, b) => b.count - a.count);
    } catch (error) {
      console.error('获取标签统计失败:', error);
      return [];
    }
  },

  /**
   * 根据查询意图查询条目
   */
  async queryItems(intent: QueryIntent): Promise<Item[]> {
    try {
      const user = localAuth.getCurrentUser();
      if (!user) return [];

      let items = await IndexedDBHelper.query<Item>(
        STORES.ITEMS,
        (item) => item.user_id === user.id && item.archived_at === null
      );

      // 根据查询类型过滤
      if (intent.queryType === 'today') {
        const today = new Date().toISOString().split('T')[0];
        items = items.filter(item => 
          item.due_date && item.due_date.startsWith(today)
        );
      } else if (intent.queryType === 'upcoming') {
        const now = new Date().toISOString();
        items = items.filter(item => 
          item.due_date && item.due_date >= now
        );
      } else if (intent.timeRange) {
        items = items.filter(item => 
          item.due_date && 
          item.due_date >= intent.timeRange!.start &&
          item.due_date <= intent.timeRange!.end
        );
      }

      // 按类型过滤
      if (intent.itemType) {
        items = items.filter(item => item.type === intent.itemType);
      }

      // 按标签过滤
      if (intent.tags && intent.tags.length > 0) {
        items = items.filter(item => 
          intent.tags!.some((tag: string) => item.tags.includes(tag))
        );
      }

      // 按关键词过滤
      if (intent.keywords && intent.keywords.length > 0) {
        items = items.filter(item => {
          const searchText = `${item.title} ${item.description} ${item.raw_text}`.toLowerCase();
          return intent.keywords!.some((keyword: string) => 
            searchText.includes(keyword.toLowerCase())
          );
        });
      }

      return items.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    } catch (error) {
      console.error('查询条目失败:', error);
      return [];
    }
  },

  /**
   * 根据标签获取条目
   */
  async getItemsByTag(tag: string): Promise<Item[]> {
    try {
      const user = localAuth.getCurrentUser();
      if (!user) return [];

      const items = await IndexedDBHelper.query<Item>(
        STORES.ITEMS,
        (item) => 
          item.user_id === user.id &&
          item.archived_at === null &&
          item.tags.includes(tag)
      );

      return items.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    } catch (error) {
      console.error('根据标签获取条目失败:', error);
      return [];
    }
  },

  /**
   * 获取指定日期范围内的历史记录（按创建时间）
   */
  async getHistoryByDateRange(startDate: string, endDate: string): Promise<Item[]> {
    try {
      const user = localAuth.getCurrentUser();
      if (!user) return [];

      const items = await IndexedDBHelper.query<Item>(
        STORES.ITEMS,
        (item) => {
          if (item.user_id !== user.id || item.archived_at !== null) return false;
          
          const createdDate = item.created_at.split('T')[0];
          return createdDate >= startDate && createdDate <= endDate;
        }
      );

      return items.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    } catch (error) {
      console.error('获取历史记录失败:', error);
      return [];
    }
  }
};

/**
 * 标签 API
 */
export const tagApi = {
  /**
   * 获取所有标签及其统计
   */
  async getAllTags(): Promise<TagStats[]> {
    try {
      const user = localAuth.getCurrentUser();
      if (!user) return [];

      const items = await IndexedDBHelper.query<Item>(
        STORES.ITEMS,
        (item) => item.user_id === user.id && item.archived_at === null
      );

      const tagCounts = new Map<string, { count: number; lastUsed: string }>();

      for (const item of items) {
        for (const tag of item.tags) {
          const existing = tagCounts.get(tag);
          if (!existing || item.created_at > existing.lastUsed) {
            tagCounts.set(tag, {
              count: (existing?.count || 0) + 1,
              lastUsed: item.created_at
            });
          } else {
            tagCounts.set(tag, {
              ...existing,
              count: existing.count + 1
            });
          }
        }
      }

      return Array.from(tagCounts.entries())
        .map(([tag, { count, lastUsed }]) => ({ tag, count, lastUsed }))
        .sort((a, b) => b.count - a.count);
    } catch (error) {
      console.error('获取标签失败:', error);
      return [];
    }
  },

  /**
   * 获取指定日期范围内的事件和任务（用于日历视图）
   * @param startDate 开始日期 (YYYY-MM-DD)
   * @param endDate 结束日期 (YYYY-MM-DD)
   */
  async getCalendarItems(startDate: string, endDate: string): Promise<Item[]> {
    try {
      const user = localAuth.getCurrentUser();
      if (!user) return [];

      const items = await IndexedDBHelper.query<Item>(
        STORES.ITEMS,
        (item) => {
          if (item.user_id !== user.id || item.archived_at !== null) return false;
          if (item.type !== 'event' && item.type !== 'task') return false;

          // 检查是否在日期范围内
          const itemDate = item.due_date || item.start_time;
          if (!itemDate) return false;

          const itemDateOnly = itemDate.split('T')[0];
          return itemDateOnly >= startDate && itemDateOnly <= endDate;
        }
      );

      return items.sort((a, b) => {
        const aDate = a.due_date || a.start_time || a.created_at;
        const bDate = b.due_date || b.start_time || b.created_at;
        return new Date(aDate).getTime() - new Date(bDate).getTime();
      });
    } catch (error) {
      console.error('获取日历条目失败:', error);
      return [];
    }
  },

};
