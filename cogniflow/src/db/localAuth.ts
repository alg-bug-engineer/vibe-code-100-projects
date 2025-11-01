/**
 * 本地认证系统
 * 完全基于本地存储的认证系统，不依赖第三方服务
 * 使用 localStorage 存储当前用户信息
 */

import { generateUUID, IndexedDBHelper, STORES } from './indexeddb';
import type { Profile, UserRole } from '@/types/types';
import { LocalStorageManager, type UserStorageRecord } from '@/services/localStorageManager';

const CURRENT_USER_KEY = 'cogniflow_current_user';
const DEFAULT_USER_ID = 'local-user-001';

/**
 * 本地用户接口
 */
export interface LocalUser {
  id: string;
  username?: string;
  phone: string | null;
  email: string | null;
  role: UserRole;
  created_at: string;
}

/**
 * 注册用户数据接口
 */
export interface RegisterUserData {
  username: string;
  email: string;
  phone?: string;
  password: string;
}

/**
 * 登录用户数据接口
 */
export interface LoginUserData {
  username?: string;
  email?: string;
  phone?: string;
  password: string;
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
        const user = JSON.parse(stored);
        // 验证用户是否仍然存在
        const userRecord = await LocalStorageManager.getUserById(user.id);
        if (userRecord) {
          this.currentUser = user;
        } else {
          // 用户记录已被删除，清除当前用户
          localStorage.removeItem(CURRENT_USER_KEY);
          this.currentUser = null;
        }
      } catch (error) {
        console.error('解析用户信息失败:', error);
        localStorage.removeItem(CURRENT_USER_KEY);
        this.currentUser = null;
      }
    }
    
    // 不再自动创建默认用户，让用户必须注册或登录
    // 如果需要快速登录功能，用户可以在登录页面使用"快速登录"
  }

  /**
   * 创建默认用户（用于快速登录）
   */
  async createDefaultUser(): Promise<LocalUser> {
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
    return defaultUser;
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
   * 用户注册
   */
  async register(userData: RegisterUserData): Promise<LocalUser> {
    try {
      // 检查用户名格式
      if (!userData.username || userData.username.length < 3) {
        throw new Error('用户名至少需要3个字符');
      }

      // 检查密码格式
      if (!userData.password || userData.password.length < 6) {
        throw new Error('密码至少需要6个字符');
      }

      // 检查邮箱格式
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userData.email)) {
        throw new Error('请输入有效的邮箱地址');
      }

      // 创建用户记录
      const userRecord = await LocalStorageManager.createUser({
        username: userData.username,
        email: userData.email,
        phone: userData.phone || null,
        passwordHash: LocalStorageManager.hashPassword(userData.password),
        role: 'user'
      });

      // 转换为LocalUser格式
      const localUser: LocalUser = {
        id: userRecord.id,
        username: userRecord.username,
        phone: userRecord.phone,
        email: userRecord.email,
        role: userRecord.role as UserRole,
        created_at: userRecord.createdAt
      };

      // 设置为当前用户
      this.setCurrentUser(localUser);

      return localUser;
    } catch (error) {
      console.error('用户注册失败:', error);
      throw error;
    }
  }

  /**
   * 用户登录（带密码验证）
   */
  async loginWithPassword(userData: LoginUserData): Promise<LocalUser> {
    try {
      let userRecord: UserStorageRecord | null = null;

      // 根据不同的登录方式查找用户
      if (userData.username) {
        userRecord = await LocalStorageManager.getUserByUsername(userData.username);
      } else if (userData.email) {
        userRecord = await LocalStorageManager.getUserByEmail(userData.email);
      } else {
        throw new Error('请输入用户名或邮箱');
      }

      if (!userRecord) {
        throw new Error('用户不存在');
      }

      // 验证密码
      if (!LocalStorageManager.verifyPassword(userData.password, userRecord.passwordHash)) {
        throw new Error('密码错误');
      }

      // 更新最后登录时间
      await LocalStorageManager.updateLastLogin(userRecord.id);

      // 转换为LocalUser格式
      const localUser: LocalUser = {
        id: userRecord.id,
        username: userRecord.username,
        phone: userRecord.phone,
        email: userRecord.email,
        role: userRecord.role as UserRole,
        created_at: userRecord.createdAt
      };

      // 设置为当前用户
      this.setCurrentUser(localUser);

      return localUser;
    } catch (error) {
      console.error('用户登录失败:', error);
      throw error;
    }
  }

  /**
   * 登录（简化版，直接使用默认用户）- 保持向后兼容
   */
  async login(phone?: string, email?: string): Promise<LocalUser> {
    let user: LocalUser;

    // 如果没有提供任何信息，直接创建/使用默认用户
    if (!phone && !email) {
      return await this.createDefaultUser();
    }

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
    loginWithPassword: (userData: LoginUserData) => localAuth.loginWithPassword(userData),
    register: (userData: RegisterUserData) => localAuth.register(userData),
    logout: () => localAuth.logout(),
    updateProfile: (updates: Partial<Profile>) => localAuth.updateProfile(updates)
  };
}

// React 依赖
import React from 'react';
