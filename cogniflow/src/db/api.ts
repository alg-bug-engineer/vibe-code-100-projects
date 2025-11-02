/**
 * API 统一导出
 * 根据配置使用本地存储或 PostgreSQL 数据库
 */

// 导入适配器（会根据 STORAGE_MODE 自动选择）
export { 
  itemApi,
  profileApi,
  auth,
  useAuth  // 统一的认证 Hook
} from './apiAdapter';

// 为了兼容性，也从 userDataApi 导出其他 API
export { 
  userProfileApi, 
  userItemApi, 
  userSettingsApi,
  tagApi 
} from './userDataApi';

// 模板 API
export { templateApi } from './templateApi';

// 认证系统 - 导出 localAuth 用于向后兼容（已废弃，请使用 useAuth）
export { localAuth, useLocalAuth } from './localAuth';

// 数据库工具（保持向后兼容）
export { initDB, getDB, exportData, importData } from './indexeddb';

// 本地存储管理器
export { LocalStorageManager } from '@/services/localStorageManager';
