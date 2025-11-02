/**
 * PostgreSQL 数据库 API 层
 * 替代 LocalStorage，使用 HTTP 请求与后端数据库交互
 */

import type { Item, ItemType, Profile, TagStats } from '@/types/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// 获取认证 token
const getAuthToken = (): string | null => {
  // 首先尝试从专门的 token 存储中获取
  const token = localStorage.getItem('cogniflow_auth_token');
  if (token) return token;
  
  // 如果没有，尝试从用户信息中获取（兼容旧版本）
  const user = localStorage.getItem('cogniflow_current_user');
  if (!user) return null;
  
  try {
    const userData = JSON.parse(user);
    return userData.token || userData.id; // 优先使用 token，否则使用 id
  } catch {
    return null;
  }
};

// 通用请求方法
async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const token = getAuthToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Network error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * 条目 API
 */
export class PostgresItemApi {
  /**
   * 创建条目
   */
  async createItem(item: Omit<Item, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Item | null> {
    try {
      console.log('📝 创建条目 (PostgreSQL):', item);
      const data = await fetchAPI('/items', {
        method: 'POST',
        body: JSON.stringify(item),
      });
      console.log('✅ 条目创建成功:', data);
      return data;
    } catch (error) {
      console.error('❌ 创建条目失败:', error);
      return null;
    }
  }

  /**
   * 获取条目列表
   */
  async getItems(filters?: {
    type?: ItemType;
    status?: string;
    tag?: string;
    archived?: boolean;
  }): Promise<Item[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.type) params.append('type', filters.type);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.tag) params.append('tag', filters.tag);
      if (filters?.archived !== undefined) params.append('archived', String(filters.archived));

      const query = params.toString();
      const data = await fetchAPI(`/items${query ? `?${query}` : ''}`);
      return data;
    } catch (error) {
      console.error('❌ 获取条目失败:', error);
      return [];
    }
  }

  /**
   * 获取单个条目
   */
  async getItem(id: string): Promise<Item | null> {
    try {
      const data = await fetchAPI(`/items/${id}`);
      return data;
    } catch (error) {
      console.error('❌ 获取条目失败:', error);
      return null;
    }
  }

  /**
   * 更新条目
   */
  async updateItem(id: string, updates: Partial<Item>): Promise<boolean> {
    try {
      await fetchAPI(`/items/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      return true;
    } catch (error) {
      console.error('❌ 更新条目失败:', error);
      return false;
    }
  }

  /**
   * 删除条目
   */
  async deleteItem(id: string): Promise<boolean> {
    try {
      await fetchAPI(`/items/${id}`, {
        method: 'DELETE',
      });
      return true;
    } catch (error) {
      console.error('❌ 删除条目失败:', error);
      return false;
    }
  }

  /**
   * 归档条目
   */
  async archiveItem(id: string): Promise<boolean> {
    try {
      await fetchAPI(`/items/${id}/archive`, {
        method: 'POST',
      });
      return true;
    } catch (error) {
      console.error('❌ 归档条目失败:', error);
      return false;
    }
  }

  /**
   * 取消归档
   */
  async unarchiveItem(id: string): Promise<boolean> {
    try {
      await fetchAPI(`/items/${id}/unarchive`, {
        method: 'POST',
      });
      return true;
    } catch (error) {
      console.error('❌ 取消归档失败:', error);
      return false;
    }
  }

  /**
   * 查询条目
   */
  async queryItems(query: any): Promise<Item[]> {
    try {
      const data = await fetchAPI('/items/query', {
        method: 'POST',
        body: JSON.stringify(query),
      });
      return data;
    } catch (error) {
      console.error('❌ 查询条目失败:', error);
      return [];
    }
  }

  /**
   * 获取日历条目
   */
  async getCalendarItems(startDate: string, endDate: string): Promise<Item[]> {
    try {
      const data = await fetchAPI(`/items/calendar?start=${startDate}&end=${endDate}`);
      return data;
    } catch (error) {
      console.error('❌ 获取日历条目失败:', error);
      return [];
    }
  }

  /**
   * 获取标签统计
   */
  async getTagStats(): Promise<TagStats[]> {
    try {
      const data = await fetchAPI('/items/tags/stats');
      return data;
    } catch (error) {
      console.error('❌ 获取标签统计失败:', error);
      return [];
    }
  }

  /**
   * 获取历史记录
   */
  async getHistoryByDateRange(startDate: string, endDate: string): Promise<any[]> {
    try {
      const data = await fetchAPI(`/items/history?start=${startDate}&end=${endDate}`);
      return data;
    } catch (error) {
      console.error('❌ 获取历史记录失败:', error);
      return [];
    }
  }

  /**
   * 获取即将到期的条目（3天内）
   */
  async getUpcomingItems(): Promise<Item[]> {
    try {
      const items = await this.getItems({ archived: false });
      const now = new Date();
      const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
      
      return items.filter(item => {
        // 排除已完成和已取消的条目
        if (item.status === 'completed' || item.status === 'cancelled') return false;
        
        // 必须有截止日期
        if (!item.due_date) return false;
        
        // 在3天内到期
        const dueDate = new Date(item.due_date);
        return dueDate >= now && dueDate <= threeDaysLater;
      }).sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime());
    } catch (error) {
      console.error('❌ 获取即将到期条目失败:', error);
      return [];
    }
  }

  /**
   * 获取待办事项（task和event类型，未完成）
   */
  async getTodoItems(): Promise<Item[]> {
    try {
      const items = await this.getItems({ archived: false });
      
      return items.filter(item => {
        // 只包含 task 和 event 类型
        if (item.type !== 'task' && item.type !== 'event') return false;
        
        // 只包含待处理状态的条目
        if (item.status === 'completed' || item.status === 'cancelled') return false;
        
        return true;
      });
    } catch (error) {
      console.error('❌ 获取待办事项失败:', error);
      return [];
    }
  }

  /**
   * 获取收件箱条目（note类型）
   */
  async getInboxItems(): Promise<Item[]> {
    try {
      return await this.getItems({ type: 'note', archived: false });
    } catch (error) {
      console.error('❌ 获取收件箱条目失败:', error);
      return [];
    }
  }

  /**
   * 获取URL条目
   */
  async getURLItems(): Promise<Item[]> {
    try {
      return await this.getItems({ type: 'url', archived: false });
    } catch (error) {
      console.error('❌ 获取URL条目失败:', error);
      return [];
    }
  }

  /**
   * 获取已归档条目
   */
  async getArchivedItems(): Promise<Item[]> {
    try {
      return await this.getItems({ archived: true });
    } catch (error) {
      console.error('❌ 获取已归档条目失败:', error);
      return [];
    }
  }

  /**
   * 获取所有历史条目
   */
  async getAllItemsHistory(): Promise<Item[]> {
    try {
      return await this.getItems({ archived: false });
    } catch (error) {
      console.error('❌ 获取历史记录失败:', error);
      return [];
    }
  }
}

/**
 * 用户 API
 */
export class PostgresUserApi {
  async getCurrentProfile(): Promise<Profile | null> {
    try {
      const data = await fetchAPI('/users/me');
      return data;
    } catch (error) {
      console.error('❌ 获取用户信息失败:', error);
      return null;
    }
  }

  async updateProfile(updates: Partial<Profile>): Promise<boolean> {
    try {
      await fetchAPI('/users/me', {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      return true;
    } catch (error) {
      console.error('❌ 更新用户信息失败:', error);
      return false;
    }
  }
}

// 导出实例
export const postgresItemApi = new PostgresItemApi();
export const postgresUserApi = new PostgresUserApi();
