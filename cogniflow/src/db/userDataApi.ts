/**
 * 用户数据隔离的API层
 * 整合本地存储和用户认证系统
 */

import { LocalStorageManager, type UserData } from '@/services/localStorageManager';
import { localAuth } from './localAuth';
import { generateUUID } from './indexeddb';
import type { Profile, Item, ItemType } from '@/types/types';

/**
 * 基础API类 - 处理用户数据隔离
 */
class BaseUserDataApi {
  /**
   * 获取当前用户ID
   */
  protected getCurrentUserId(): string | null {
    const user = localAuth.getCurrentUser();
    return user?.id || null;
  }

  /**
   * 获取当前用户数据
   */
  protected async getCurrentUserData(): Promise<UserData | null> {
    const userId = this.getCurrentUserId();
    if (!userId) return null;
    
    return await LocalStorageManager.getUserData(userId);
  }

  /**
   * 保存用户数据
   */
  protected async saveCurrentUserData(userData: UserData): Promise<void> {
    const userId = this.getCurrentUserId();
    if (!userId) throw new Error('用户未登录');
    
    await LocalStorageManager.saveUserData(userId, userData);
  }

  /**
   * 确保用户已登录
   */
  protected ensureAuthenticated(): void {
    if (!this.getCurrentUserId()) {
      throw new Error('用户未登录');
    }
  }
}

/**
 * 用户信息API
 */
export class UserProfileApi extends BaseUserDataApi {
  /**
   * 获取当前用户信息
   */
  async getCurrentProfile(): Promise<Profile | null> {
    const userData = await this.getCurrentUserData();
    return userData?.profile || null;
  }

  /**
   * 更新用户信息
   */
  async updateProfile(updates: Partial<Profile>): Promise<boolean> {
    try {
      this.ensureAuthenticated();
      const userData = await this.getCurrentUserData();
      if (!userData) return false;

      userData.profile = { ...userData.profile, ...updates };
      await this.saveCurrentUserData(userData);
      
      // 同时更新认证系统中的用户信息
      await localAuth.updateProfile(updates);
      
      return true;
    } catch (error) {
      console.error('更新用户信息失败:', error);
      return false;
    }
  }

  /**
   * 获取所有用户列表（管理员功能）
   */
  async getAllUsers(): Promise<Profile[]> {
    try {
      const users = await LocalStorageManager.getAllUsers();
      return users.map(user => ({
        id: user.id,
        phone: user.phone,
        email: user.email,
        role: user.role as any,
        created_at: user.createdAt
      }));
    } catch (error) {
      console.error('获取用户列表失败:', error);
      return [];
    }
  }
}

/**
 * 条目API
 */
export class UserItemApi extends BaseUserDataApi {
  /**
   * 创建条目
   */
  async createItem(item: Omit<Item, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Item | null> {
    try {
      console.log('📝 开始创建条目...');
      console.log('📝 条目数据:', item);
      
      // 检查用户认证
      this.ensureAuthenticated();
      const userId = this.getCurrentUserId();
      console.log('👤 当前用户ID:', userId);
      
      if (!userId) {
        console.error('❌ 无法获取用户ID');
        return null;
      }
      
      // 获取用户数据
      const userData = await this.getCurrentUserData();
      console.log('📦 用户数据获取结果:', userData ? '成功' : '失败');
      
      if (!userData) {
        console.error('❌ 无法获取用户数据，可能需要初始化');
        // 尝试初始化用户数据
        try {
          await LocalStorageManager.initializeUserData(userId);
          const retryUserData = await this.getCurrentUserData();
          if (!retryUserData) {
            console.error('❌ 初始化后仍无法获取用户数据');
            return null;
          }
          console.log('✅ 用户数据初始化成功，重试创建');
          return this.createItem(item); // 递归重试
        } catch (initError) {
          console.error('❌ 初始化用户数据失败:', initError);
          return null;
        }
      }

      const newItem: Item = {
        ...item,
        id: generateUUID(),
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('➕ 创建新条目:', newItem);

      userData.items.push(newItem);
      await this.saveCurrentUserData(userData);

      console.log(`✅ 条目已保存，当前总数: ${userData.items.length}`);

      return newItem;
    } catch (error) {
      console.error('❌ 创建条目失败:', error);
      return null;
    }
  }  /**
   * 获取条目列表
   * 注意：默认不包含已归档的条目，除非明确指定 archived: true
   */
  async getItems(filters?: {
    type?: ItemType;
    status?: string;
    tag?: string;
    archived?: boolean;
  }): Promise<Item[]> {
    try {
      const userData = await this.getCurrentUserData();
      if (!userData) {
        console.log('❌ 未找到用户数据');
        return [];
      }

      console.log(`📦 原始条目数量: ${userData.items.length}`, filters);

      let items = userData.items;

      // 应用过滤条件
      items = items.filter(item => {
        // 类型过滤
        if (filters?.type && item.type !== filters.type) {
          return false;
        }

        // 状态过滤
        if (filters?.status && item.status !== filters.status) {
          return false;
        }

        // 标签过滤
        if (filters?.tag && !item.tags.includes(filters.tag)) {
          return false;
        }

        // 归档状态过滤
        // 默认排除已归档的条目，除非明确指定 archived: true
        if (filters?.archived !== undefined) {
          const isArchived = item.archived_at !== null;
          if (filters.archived !== isArchived) {
            return false;
          }
        } else {
          // 如果没有指定 archived 参数，默认只返回未归档的
          if (item.archived_at !== null) {
            return false;
          }
        }

        return true;
      });

      console.log(`✅ 过滤后条目数量: ${items.length}`);

      // 按创建时间倒序排列
      return items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } catch (error) {
      console.error('获取条目列表失败:', error);
      return [];
    }
  }

  /**
   * 根据ID获取条目
   */
  async getItemById(id: string): Promise<Item | null> {
    try {
      const userData = await this.getCurrentUserData();
      if (!userData) return null;

      return userData.items.find(item => item.id === id) || null;
    } catch (error) {
      console.error('获取条目失败:', error);
      return null;
    }
  }

  /**
   * 更新条目
   */
  async updateItem(id: string, updates: Partial<Item>): Promise<boolean> {
    try {
      this.ensureAuthenticated();
      const userData = await this.getCurrentUserData();
      if (!userData) return false;

      const itemIndex = userData.items.findIndex(item => item.id === id);
      if (itemIndex === -1) return false;

      userData.items[itemIndex] = {
        ...userData.items[itemIndex],
        ...updates,
        updated_at: new Date().toISOString()
      };

      await this.saveCurrentUserData(userData);
      return true;
    } catch (error) {
      console.error('更新条目失败:', error);
      return false;
    }
  }

  /**
   * 删除条目
   */
  async deleteItem(id: string): Promise<boolean> {
    try {
      this.ensureAuthenticated();
      const userData = await this.getCurrentUserData();
      if (!userData) return false;

      const itemIndex = userData.items.findIndex(item => item.id === id);
      if (itemIndex === -1) return false;

      userData.items.splice(itemIndex, 1);
      await this.saveCurrentUserData(userData);
      return true;
    } catch (error) {
      console.error('删除条目失败:', error);
      return false;
    }
  }

  /**
   * 归档条目
   */
  async archiveItem(id: string): Promise<boolean> {
    return this.updateItem(id, { 
      archived_at: new Date().toISOString() 
    });
  }

  /**
   * 恢复归档条目
   */
  async unarchiveItem(id: string): Promise<boolean> {
    return this.updateItem(id, { 
      archived_at: null 
    });
  }

  /**
   * 批量操作
   */
  async bulkUpdateItems(ids: string[], updates: Partial<Item>): Promise<number> {
    try {
      this.ensureAuthenticated();
      const userData = await this.getCurrentUserData();
      if (!userData) return 0;

      let updatedCount = 0;
      const now = new Date().toISOString();

      for (const id of ids) {
        const itemIndex = userData.items.findIndex(item => item.id === id);
        if (itemIndex !== -1) {
          userData.items[itemIndex] = {
            ...userData.items[itemIndex],
            ...updates,
            updated_at: now
          };
          updatedCount++;
        }
      }

      if (updatedCount > 0) {
        await this.saveCurrentUserData(userData);
      }

      return updatedCount;
    } catch (error) {
      console.error('批量更新条目失败:', error);
      return 0;
    }
  }

  /**
   * 获取标签统计
   */
  async getTagStats(): Promise<any[]> {
    try {
      const userData = await this.getCurrentUserData();
      if (!userData) return [];

      const tagCounts: Record<string, { count: number; lastUsed: string }> = {};
      
      for (const item of userData.items) {
        if (item.archived_at === null) { // 只统计未归档的条目
          for (const tag of item.tags) {
            if (!tagCounts[tag]) {
              tagCounts[tag] = { count: 0, lastUsed: item.updated_at };
            }
            tagCounts[tag].count++;
            // 更新最后使用时间（取最新的）
            if (new Date(item.updated_at) > new Date(tagCounts[tag].lastUsed)) {
              tagCounts[tag].lastUsed = item.updated_at;
            }
          }
        }
      }

      return Object.entries(tagCounts).map(([tag, data]) => ({
        tag,
        count: data.count,
        lastUsed: data.lastUsed
      }));
    } catch (error) {
      console.error('获取标签统计失败:', error);
      return [];
    }
  }

  /**
   * 搜索条目
   */
  async searchItems(query: string | string[]): Promise<Item[]> {
    try {
      const userData = await this.getCurrentUserData();
      if (!userData) return [];

      const searchTerms = Array.isArray(query) ? query : [query];
      const lowerSearchTerms = searchTerms.map(term => term.toLowerCase());
      
      return userData.items.filter(item => {
        return lowerSearchTerms.some(term =>
          item.title?.toLowerCase().includes(term) ||
          item.description?.toLowerCase().includes(term) ||
          item.raw_text.toLowerCase().includes(term) ||
          item.tags.some(tag => tag.toLowerCase().includes(term))
        );
      });
    } catch (error) {
      console.error('搜索条目失败:', error);
      return [];
    }
  }

  /**
   * 获取即将到期的条目（只显示未完成的）
   */
  async getUpcomingItems(): Promise<Item[]> {
    try {
      const items = await this.getItems();
      const now = new Date();
      const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
      
      return items.filter(item => {
        // 排除已归档
        if (item.archived_at) return false;
        
        // 排除已完成和已取消的条目
        if (item.status === 'completed' || item.status === 'cancelled') return false;
        
        // 必须有截止日期
        if (!item.due_date) return false;
        
        // 在3天内到期
        const dueDate = new Date(item.due_date);
        return dueDate >= now && dueDate <= threeDaysLater;
      }).sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime());
    } catch (error) {
      console.error('获取即将到期条目失败:', error);
      return [];
    }
  }

  /**
   * 获取待办事项（只包含需要执行的任务和事件）
   */
  async getTodoItems(): Promise<Item[]> {
    try {
      const items = await this.getItems();
      console.log('🔍 getTodoItems 过滤前:', items.length);
      
      const filtered = items.filter(item => {
        // 排除已归档
        if (item.archived_at) return false;
        
        // 只包含 task 和 event 类型（排除 note、data、url）
        if (item.type !== 'task' && item.type !== 'event') return false;
        
        // 只包含待处理状态的条目（排除已完成、已取消）
        if (item.status === 'completed' || item.status === 'cancelled') return false;
        
        return true;
      });
      
      console.log('✅ getTodoItems 过滤后:', filtered.length);
      return filtered;
    } catch (error) {
      console.error('获取待办事项失败:', error);
      return [];
    }
  }

  /**
   * 获取收件箱条目（只显示笔记类型）
   * 收件箱定位：记录性内容的专属空间
   */
  async getInboxItems(): Promise<Item[]> {
    try {
      const items = await this.getItems();
      console.log('🔍 getInboxItems 过滤前:', items.length);
      
      const filtered = items.filter(item => 
        !item.archived_at && 
        item.type === 'note'  // 只显示笔记类型
      );
      
      console.log('✅ getInboxItems 过滤后:', filtered.length);
      return filtered;
    } catch (error) {
      console.error('获取收件箱条目失败:', error);
      return [];
    }
  }

  /**
   * 获取URL条目
   */
  async getURLItems(): Promise<Item[]> {
    try {
      return await this.getItems({
        type: 'url'
      });
    } catch (error) {
      console.error('获取URL条目失败:', error);
      return [];
    }
  }

  /**
   * 获取已归档条目
   */
  async getArchivedItems(): Promise<Item[]> {
    try {
      return await this.getItems({
        archived: true
      });
    } catch (error) {
      console.error('获取已归档条目失败:', error);
      return [];
    }
  }

  /**
   * 获取所有历史条目（不包括已归档）
   */
  async getAllItemsHistory(): Promise<Item[]> {
    try {
      const items = await this.getItems();
      // 过滤掉已归档的条目
      const activeItems = items.filter(item => !item.archived_at);
      return activeItems.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } catch (error) {
      console.error('获取历史条目失败:', error);
      return [];
    }
  }

  /**
   * 查询条目（根据查询意图）
   */
  async queryItems(intent: any): Promise<Item[]> {
    try {
      const userData = await this.getCurrentUserData();
      if (!userData) return [];

      let items = userData.items.filter(item => !item.archived_at);

      // 根据查询意图过滤
      if (intent.type) {
        items = items.filter(item => item.type === intent.type);
      }

      if (intent.status) {
        items = items.filter(item => item.status === intent.status);
      }

      if (intent.tags && intent.tags.length > 0) {
        items = items.filter(item => 
          intent.tags.some((tag: string) => item.tags.includes(tag))
        );
      }

      if (intent.keywords && intent.keywords.length > 0) {
        items = items.filter(item => {
          const searchText = `${item.title} ${item.description} ${item.raw_text}`.toLowerCase();
          return intent.keywords.some((keyword: string) => 
            searchText.includes(keyword.toLowerCase())
          );
        });
      }

      if (intent.dateRange) {
        const { start, end } = intent.dateRange;
        items = items.filter(item => {
          const itemDate = new Date(item.created_at);
          return itemDate >= start && itemDate <= end;
        });
      }

      return items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } catch (error) {
      console.error('查询条目失败:', error);
      return [];
    }
  }

  /**
   * 根据标签获取条目
   */
  async getItemsByTag(tag: string): Promise<Item[]> {
    try {
      const items = await this.getItems();
      return items.filter(item => 
        !item.archived_at && 
        item.tags.includes(tag)
      );
    } catch (error) {
      console.error('根据标签获取条目失败:', error);
      return [];
    }
  }

  /**
   * 获取指定日期范围内的历史记录（不包括已归档）
   */
  async getHistoryByDateRange(startDate: string, endDate: string): Promise<Item[]> {
    try {
      const items = await this.getItems();
      return items.filter(item => {
        // 排除已归档的条目
        if (item.archived_at) return false;
        
        const createdDate = item.created_at.split('T')[0];
        return createdDate >= startDate && createdDate <= endDate;
      }).sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    } catch (error) {
      console.error('获取历史记录失败:', error);
      return [];
    }
  }
}

/**
 * 用户设置API
 */
export class UserSettingsApi extends BaseUserDataApi {
  /**
   * 获取用户设置
   */
  async getSettings(): Promise<Record<string, any>> {
    try {
      const userData = await this.getCurrentUserData();
      return userData?.settings || {};
    } catch (error) {
      console.error('获取用户设置失败:', error);
      return {};
    }
  }

  /**
   * 更新用户设置
   */
  async updateSettings(settings: Record<string, any>): Promise<boolean> {
    try {
      this.ensureAuthenticated();
      const userData = await this.getCurrentUserData();
      if (!userData) return false;

      userData.settings = { ...userData.settings, ...settings };
      await this.saveCurrentUserData(userData);
      return true;
    } catch (error) {
      console.error('更新用户设置失败:', error);
      return false;
    }
  }

  /**
   * 重置用户设置
   */
  async resetSettings(): Promise<boolean> {
    try {
      this.ensureAuthenticated();
      const userData = await this.getCurrentUserData();
      if (!userData) return false;

      userData.settings = {
        theme: 'system',
        language: 'zh-CN',
        notifications: true
      };
      
      await this.saveCurrentUserData(userData);
      return true;
    } catch (error) {
      console.error('重置用户设置失败:', error);
      return false;
    }
  }
}

// 导出API实例
export const userProfileApi = new UserProfileApi();
export const userItemApi = new UserItemApi();
export const userSettingsApi = new UserSettingsApi();

// 兼容性导出（替代原有的API）
export const profileApi = userProfileApi;
export const itemApi = userItemApi;

// 标签API（基于条目数据）
export const tagApi = {
  async getTagStats() {
    return userItemApi.getTagStats();
  }
};