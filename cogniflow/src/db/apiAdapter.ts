/**
 * 统一的数据API适配器
 * 根据配置自动选择 LocalStorage 或 PostgreSQL
 */

import React from 'react';
import { USE_POSTGRES } from '@/config/storage';
import { userItemApi as localItemApi, userProfileApi as localProfileApi } from './userDataApi';
import { postgresItemApi, postgresUserApi } from './postgresApi';
import { localAuth, type LoginUserData, type RegisterUserData, type LocalUser } from './localAuth';
import { postgresAuth } from './postgresAuth';
import type { Profile } from '@/types/types';

// 导出统一的 API
export const itemApi = USE_POSTGRES ? postgresItemApi : localItemApi;
export const profileApi = USE_POSTGRES ? postgresUserApi : localProfileApi;

// 导出统一的认证 API
export const auth = USE_POSTGRES ? postgresAuth : localAuth;

/**
 * 统一的认证 Hook
 * 根据配置自动使用 LocalAuth 或 PostgresAuth
 */
export function useAuth() {
  const currentAuth = USE_POSTGRES ? postgresAuth : localAuth;
  const [user, setUser] = React.useState<LocalUser | null>(currentAuth.getCurrentUser());

  React.useEffect(() => {
    // 初始化认证
    currentAuth.initialize();
    
    // 订阅认证状态变化
    let unsubscribe: (() => void) | undefined;
    
    if (USE_POSTGRES) {
      unsubscribe = (currentAuth as typeof postgresAuth).addListener(setUser);
    } else {
      unsubscribe = (currentAuth as typeof localAuth).onAuthStateChange(setUser);
    }
    
    return unsubscribe || (() => {});
  }, []);

  return {
    user,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    login: async (phone?: string, email?: string) => {
      if (USE_POSTGRES) {
        throw new Error('PostgreSQL 模式请使用 loginWithPassword 方法');
      }
      return (currentAuth as typeof localAuth).login(phone, email);
    },
    loginWithPassword: async (userData: LoginUserData) => {
      if (USE_POSTGRES) {
        return (currentAuth as typeof postgresAuth).login(userData);
      }
      return (currentAuth as typeof localAuth).loginWithPassword(userData);
    },
    register: (userData: RegisterUserData) => currentAuth.register(userData),
    logout: () => currentAuth.logout(),
    updateProfile: async (updates: Partial<Profile>) => {
      if (USE_POSTGRES) {
        throw new Error('PostgreSQL 模式暂不支持更新个人资料');
      }
      return (currentAuth as typeof localAuth).updateProfile(updates);
    }
  };
}

// 保持向后兼容 - useLocalAuth 现在调用 useAuth
export { useAuth as useLocalAuth };
export { initDB, getDB, exportData, importData } from './indexeddb';
export { LocalStorageManager } from '@/services/localStorageManager';

// 导出原始 API 供特殊用途
export { userItemApi as localItemApi, userProfileApi as localProfileApi } from './userDataApi';
export { postgresItemApi, postgresUserApi } from './postgresApi';
export { localAuth } from './localAuth';
export { postgresAuth } from './postgresAuth';

console.log(`🔌 使用 ${USE_POSTGRES ? 'PostgreSQL' : 'LocalStorage'} 数据存储`);

