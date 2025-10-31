/**
 * API 统一导出
 * 使用本地 IndexedDB 存储，完全移除 Supabase 依赖
 */

export { profileApi, itemApi, tagApi } from './localApi';
export { localAuth, useLocalAuth } from './localAuth';
export { initDB, getDB, exportData, importData } from './indexeddb';
