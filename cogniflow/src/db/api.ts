/**
 * API 统一导出
 * 使用本地存储，支持用户数据隔离
 */

// 新的用户数据隔离API
export { 
  userProfileApi, 
  userItemApi, 
  userSettingsApi,
  profileApi, 
  itemApi, 
  tagApi 
} from './userDataApi';

// 认证系统
export { localAuth, useLocalAuth } from './localAuth';

// 数据库工具（保持向后兼容）
export { initDB, getDB, exportData, importData } from './indexeddb';

// 本地存储管理器
export { LocalStorageManager } from '@/services/localStorageManager';
