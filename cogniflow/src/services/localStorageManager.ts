/**
 * 本地用户数据存储服务
 * 使用本地文件存储用户数据，支持多用户数据隔离
 */

import type { LocalUser } from '@/db/localAuth';
import type { Item, Profile } from '@/types/types';

/**
 * 存储路径配置
 */
const STORAGE_CONFIG = {
  USERS_FILE: 'cogniflow_users.json',
  USER_DATA_PREFIX: 'cogniflow_user_',
  CURRENT_USER_KEY: 'cogniflow_current_user'
};

/**
 * 用户数据接口
 */
export interface UserData {
  items: Item[];
  profile: Profile;
  settings: Record<string, any>;
  lastModified: string;
}

/**
 * 用户存储记录
 */
export interface UserStorageRecord {
  id: string;
  username: string;
  email: string | null;
  phone: string | null;
  passwordHash: string;
  role: string;
  createdAt: string;
  lastLoginAt: string | null;
}

/**
 * 本地存储管理类
 */
export class LocalStorageManager {
  /**
   * 获取所有用户记录
   */
  static async getAllUsers(): Promise<UserStorageRecord[]> {
    try {
      const data = localStorage.getItem(STORAGE_CONFIG.USERS_FILE);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('读取用户记录失败:', error);
      return [];
    }
  }

  /**
   * 保存用户记录
   */
  static async saveUsers(users: UserStorageRecord[]): Promise<void> {
    try {
      localStorage.setItem(STORAGE_CONFIG.USERS_FILE, JSON.stringify(users));
    } catch (error) {
      console.error('保存用户记录失败:', error);
      throw new Error('保存用户记录失败');
    }
  }

  /**
   * 根据用户名查找用户
   */
  static async getUserByUsername(username: string): Promise<UserStorageRecord | null> {
    const users = await this.getAllUsers();
    return users.find(user => user.username === username) || null;
  }

  /**
   * 根据邮箱查找用户
   */
  static async getUserByEmail(email: string): Promise<UserStorageRecord | null> {
    const users = await this.getAllUsers();
    return users.find(user => user.email === email) || null;
  }

  /**
   * 根据ID查找用户
   */
  static async getUserById(id: string): Promise<UserStorageRecord | null> {
    const users = await this.getAllUsers();
    return users.find(user => user.id === id) || null;
  }

  /**
   * 创建新用户
   */
  static async createUser(userData: Omit<UserStorageRecord, 'id' | 'createdAt' | 'lastLoginAt'>): Promise<UserStorageRecord> {
    const users = await this.getAllUsers();
    
    // 检查用户名是否已存在
    if (users.some(user => user.username === userData.username)) {
      throw new Error('用户名已存在');
    }

    // 检查邮箱是否已存在
    if (userData.email && users.some(user => user.email === userData.email)) {
      throw new Error('邮箱已被使用');
    }

    const newUser: UserStorageRecord = {
      id: this.generateUserId(),
      ...userData,
      createdAt: new Date().toISOString(),
      lastLoginAt: null
    };

    users.push(newUser);
    await this.saveUsers(users);

    // 初始化用户数据
    await this.initializeUserData(newUser.id);

    return newUser;
  }

  /**
   * 更新用户最后登录时间
   */
  static async updateLastLogin(userId: string): Promise<void> {
    const users = await this.getAllUsers();
    const userIndex = users.findIndex(user => user.id === userId);
    
    if (userIndex !== -1) {
      users[userIndex].lastLoginAt = new Date().toISOString();
      await this.saveUsers(users);
    }
  }

  /**
   * 获取用户数据
   */
  static async getUserData(userId: string): Promise<UserData | null> {
    try {
      const key = `${STORAGE_CONFIG.USER_DATA_PREFIX}${userId}`;
      console.log('📖 读取用户数据, key:', key);
      
      const data = localStorage.getItem(key);
      if (!data) {
        console.warn('⚠️ 用户数据不存在，key:', key);
        return null;
      }
      
      const parsedData = JSON.parse(data);
      console.log('✅ 用户数据读取成功, items数量:', parsedData.items?.length || 0);
      return parsedData;
    } catch (error) {
      console.error('❌ 读取用户数据失败:', error);
      return null;
    }
  }

  /**
   * 保存用户数据
   */
  static async saveUserData(userId: string, userData: UserData): Promise<void> {
    try {
      const key = `${STORAGE_CONFIG.USER_DATA_PREFIX}${userId}`;
      userData.lastModified = new Date().toISOString();
      localStorage.setItem(key, JSON.stringify(userData));
    } catch (error) {
      console.error('保存用户数据失败:', error);
      throw new Error('保存用户数据失败');
    }
  }

  /**
   * 初始化用户数据
   */
  static async initializeUserData(userId: string): Promise<void> {
    console.log('🔧 初始化用户数据, userId:', userId);
    
    const user = await this.getUserById(userId);
    if (!user) {
      console.error('❌ 用户不存在，无法初始化数据');
      throw new Error('用户不存在');
    }

    console.log('👤 找到用户信息:', user);

    const initialData: UserData = {
      items: [],
      profile: {
        id: userId,
        phone: user.phone,
        email: user.email,
        role: user.role as any,
        created_at: user.createdAt
      },
      settings: {
        theme: 'system',
        language: 'zh-CN',
        notifications: true
      },
      lastModified: new Date().toISOString()
    };

    await this.saveUserData(userId, initialData);
    console.log('✅ 用户数据初始化完成');
  }

  /**
   * 删除用户数据
   */
  static async deleteUserData(userId: string): Promise<void> {
    try {
      const key = `${STORAGE_CONFIG.USER_DATA_PREFIX}${userId}`;
      localStorage.removeItem(key);
    } catch (error) {
      console.error('删除用户数据失败:', error);
    }
  }

  /**
   * 获取当前用户ID
   */
  static getCurrentUserId(): string | null {
    try {
      const data = localStorage.getItem(STORAGE_CONFIG.CURRENT_USER_KEY);
      if (data) {
        const user = JSON.parse(data);
        return user.id;
      }
      return null;
    } catch (error) {
      console.error('获取当前用户ID失败:', error);
      return null;
    }
  }

  /**
   * 设置当前用户
   */
  static setCurrentUser(user: LocalUser | null): void {
    if (user) {
      localStorage.setItem(STORAGE_CONFIG.CURRENT_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_CONFIG.CURRENT_USER_KEY);
    }
  }

  /**
   * 生成用户ID
   */
  private static generateUserId(): string {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * 密码哈希（简单实现，生产环境应使用更安全的方法）
   */
  static hashPassword(password: string): string {
    // 注意：这是一个简单的哈希实现，生产环境应使用更安全的方法
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    return hash.toString();
  }

  /**
   * 验证密码
   */
  static verifyPassword(password: string, hash: string): boolean {
    return this.hashPassword(password) === hash;
  }

  /**
   * 清空所有数据
   */
  static async clearAllData(): Promise<void> {
    try {
      // 获取所有用户
      const users = await this.getAllUsers();
      
      // 删除用户数据文件
      for (const user of users) {
        await this.deleteUserData(user.id);
      }

      // 删除用户记录文件
      localStorage.removeItem(STORAGE_CONFIG.USERS_FILE);
      
      // 清除当前用户
      localStorage.removeItem(STORAGE_CONFIG.CURRENT_USER_KEY);
    } catch (error) {
      console.error('清空数据失败:', error);
    }
  }

  /**
   * 导出用户数据
   */
  static async exportUserData(userId: string): Promise<string | null> {
    try {
      const userData = await this.getUserData(userId);
      const userRecord = await this.getUserById(userId);
      
      if (!userData || !userRecord) {
        return null;
      }

      const exportData = {
        userInfo: {
          username: userRecord.username,
          email: userRecord.email,
          phone: userRecord.phone,
          role: userRecord.role,
          createdAt: userRecord.createdAt
        },
        userData,
        exportedAt: new Date().toISOString()
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('导出用户数据失败:', error);
      return null;
    }
  }

  /**
   * 导入用户数据
   */
  static async importUserData(importDataString: string): Promise<boolean> {
    try {
      const importData = JSON.parse(importDataString);
      
      if (!importData.userInfo || !importData.userData) {
        throw new Error('无效的导入数据格式');
      }

      // 检查用户是否已存在
      const existingUser = await this.getUserByUsername(importData.userInfo.username);
      if (existingUser) {
        throw new Error('用户名已存在');
      }

      // 创建用户记录
      const newUser = await this.createUser({
        username: importData.userInfo.username,
        email: importData.userInfo.email,
        phone: importData.userInfo.phone,
        passwordHash: '', // 需要重新设置密码
        role: importData.userInfo.role
      });

      // 保存用户数据
      await this.saveUserData(newUser.id, importData.userData);

      return true;
    } catch (error) {
      console.error('导入用户数据失败:', error);
      return false;
    }
  }
}