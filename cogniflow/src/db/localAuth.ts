/**
 * 本地认证系统
 * 完全基于本地存储的认证系统，不依赖第三方服务
 * 使用 localStorage 存储当前用户信息
 */

import { generateUUID, IndexedDBHelper, STORES } from './indexeddb';
import type { Profile, UserRole } from '@/types/types';

const CURRENT_USER_KEY = 'cogniflow_current_user';
const DEFAULT_USER_ID = 'local-user-001';

/**
 * 本地用户接口
 */
export interface LocalUser {
  id: string;
  phone: string | null;
  email: string | null;
  role: UserRole;
  created_at: string;
}

/**
 * 认证状态管理
 */
class LocalAuth {
  private currentUser: LocalUser | null = null;
  private listeners: Array<(user: LocalUser | null) => void> = [];

  /**
   * 初始化认证系统
   */
  async initialize(): Promise<void> {
    // 从 localStorage 读取当前用户
    const stored = localStorage.getItem(CURRENT_USER_KEY);
    if (stored) {
      try {
        this.currentUser = JSON.parse(stored);
      } catch (error) {
        console.error('解析用户信息失败:', error);
        localStorage.removeItem(CURRENT_USER_KEY);
      }
    }

    // 如果没有用户，创建默认用户
    if (!this.currentUser) {
      await this.createDefaultUser();
    }
  }

  /**
   * 创建默认用户
   */
  private async createDefaultUser(): Promise<void> {
    const defaultUser: LocalUser = {
      id: DEFAULT_USER_ID,
      phone: null,
      email: null,
      role: 'user',
      created_at: new Date().toISOString()
    };

    // 保存到 IndexedDB
    try {
      const existingProfile = await IndexedDBHelper.getById<Profile>(
        STORES.PROFILES,
        DEFAULT_USER_ID
      );

      if (!existingProfile) {
        await IndexedDBHelper.add(STORES.PROFILES, defaultUser);
      }
    } catch (error) {
      console.error('创建默认用户失败:', error);
    }

    // 设置为当前用户
    this.setCurrentUser(defaultUser);
  }

  /**
   * 获取当前用户
   */
  getCurrentUser(): LocalUser | null {
    return this.currentUser;
  }

  /**
   * 设置当前用户
   */
  setCurrentUser(user: LocalUser | null): void {
    this.currentUser = user;
    
    if (user) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(CURRENT_USER_KEY);
    }

    // 通知所有监听器
    this.notifyListeners();
  }

  /**
   * 登录（简化版，直接使用默认用户）
   */
  async login(phone?: string, email?: string): Promise<LocalUser> {
    let user: LocalUser;

    // 尝试查找现有用户
    const profiles = await IndexedDBHelper.getAll<Profile>(STORES.PROFILES);
    const existingUser = profiles.find(
      p => (phone && p.phone === phone) || (email && p.email === email)
    );

    if (existingUser) {
      user = existingUser as LocalUser;
    } else {
      // 创建新用户
      user = {
        id: generateUUID(),
        phone: phone || null,
        email: email || null,
        role: 'user',
        created_at: new Date().toISOString()
      };

      await IndexedDBHelper.add(STORES.PROFILES, user);
    }

    this.setCurrentUser(user);
    return user;
  }

  /**
   * 登出
   */
  logout(): void {
    this.setCurrentUser(null);
  }

  /**
   * 检查是否已登录
   */
  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  /**
   * 检查是否为管理员
   */
  isAdmin(): boolean {
    return this.currentUser?.role === 'admin';
  }

  /**
   * 更新用户信息
   */
  async updateProfile(updates: Partial<Profile>): Promise<boolean> {
    if (!this.currentUser) {
      return false;
    }

    try {
      const updatedUser = {
        ...this.currentUser,
        ...updates
      };

      await IndexedDBHelper.update(STORES.PROFILES, updatedUser);
      this.setCurrentUser(updatedUser as LocalUser);
      return true;
    } catch (error) {
      console.error('更新用户信息失败:', error);
      return false;
    }
  }

  /**
   * 监听认证状态变化
   */
  onAuthStateChange(callback: (user: LocalUser | null) => void): () => void {
    this.listeners.push(callback);

    // 返回取消监听的函数
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  /**
   * 通知所有监听器
   */
  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener(this.currentUser);
    }
  }
}

// 导出单例
export const localAuth = new LocalAuth();

/**
 * React Hook - 替代 useAuth
 */
export function useLocalAuth() {
  const [user, setUser] = React.useState<LocalUser | null>(localAuth.getCurrentUser());

  React.useEffect(() => {
    // 订阅认证状态变化
    const unsubscribe = localAuth.onAuthStateChange(setUser);
    return unsubscribe;
  }, []);

  return {
    user,
    isAuthenticated: localAuth.isAuthenticated(),
    isAdmin: localAuth.isAdmin(),
    login: (phone?: string, email?: string) => localAuth.login(phone, email),
    logout: () => localAuth.logout(),
    updateProfile: (updates: Partial<Profile>) => localAuth.updateProfile(updates)
  };
}

// React 依赖
import React from 'react';
