/**
 * 数据存储配置
 * 控制使用 LocalStorage 还是 PostgreSQL
 */

// 数据存储模式
export type StorageMode = 'local' | 'postgres';

// 从环境变量读取配置
export const STORAGE_MODE: StorageMode = (import.meta.env.VITE_STORAGE_MODE as StorageMode) || 'local';

// API 基础 URL
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// 是否启用 PostgreSQL
export const USE_POSTGRES = STORAGE_MODE === 'postgres';

console.log(`📦 数据存储模式: ${STORAGE_MODE}`);
console.log(`🔗 API 地址: ${API_BASE_URL}`);
