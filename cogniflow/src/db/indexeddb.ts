/**
 * IndexedDB 本地数据库封装
 * 用于替代 Supabase，实现完全本地化的数据存储
 */

const DB_NAME = 'CogniFlowDB';
const DB_VERSION = 1;

// 数据库表名
export const STORES = {
  PROFILES: 'profiles',
  ITEMS: 'items',
  TAGS: 'tags'
};

/**
 * 初始化 IndexedDB 数据库
 */
export function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error('无法打开数据库'));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // 创建 profiles 表
      if (!db.objectStoreNames.contains(STORES.PROFILES)) {
        const profileStore = db.createObjectStore(STORES.PROFILES, { keyPath: 'id' });
        profileStore.createIndex('phone', 'phone', { unique: true });
        profileStore.createIndex('email', 'email', { unique: true });
      }

      // 创建 items 表
      if (!db.objectStoreNames.contains(STORES.ITEMS)) {
        const itemStore = db.createObjectStore(STORES.ITEMS, { keyPath: 'id' });
        itemStore.createIndex('user_id', 'user_id', { unique: false });
        itemStore.createIndex('type', 'type', { unique: false });
        itemStore.createIndex('status', 'status', { unique: false });
        itemStore.createIndex('created_at', 'created_at', { unique: false });
        itemStore.createIndex('due_date', 'due_date', { unique: false });
        itemStore.createIndex('archived_at', 'archived_at', { unique: false });
      }

      // 创建 tags 表
      if (!db.objectStoreNames.contains(STORES.TAGS)) {
        const tagStore = db.createObjectStore(STORES.TAGS, { keyPath: 'name' });
        tagStore.createIndex('count', 'count', { unique: false });
      }
    };
  });
}

/**
 * 获取数据库连接
 */
let dbInstance: IDBDatabase | null = null;

export async function getDB(): Promise<IDBDatabase> {
  if (!dbInstance) {
    dbInstance = await initDB();
  }
  return dbInstance;
}

/**
 * 通用的数据库操作方法
 */
export class IndexedDBHelper {
  /**
   * 添加数据
   */
  static async add<T>(storeName: string, data: T): Promise<T> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.add(data);

      request.onsuccess = () => resolve(data);
      request.onerror = () => reject(new Error(`添加数据失败: ${request.error}`));
    });
  }

  /**
   * 更新数据
   */
  static async update<T>(storeName: string, data: T): Promise<T> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onsuccess = () => resolve(data);
      request.onerror = () => reject(new Error(`更新数据失败: ${request.error}`));
    });
  }

  /**
   * 删除数据
   */
  static async delete(storeName: string, key: string): Promise<void> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error(`删除数据失败: ${request.error}`));
    });
  }

  /**
   * 根据 ID 获取单条数据
   */
  static async getById<T>(storeName: string, id: string): Promise<T | null> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(new Error(`获取数据失败: ${request.error}`));
    });
  }

  /**
   * 获取所有数据
   */
  static async getAll<T>(storeName: string): Promise<T[]> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(new Error(`获取所有数据失败: ${request.error}`));
    });
  }

  /**
   * 根据索引查询数据
   */
  static async getByIndex<T>(
    storeName: string,
    indexName: string,
    value: any
  ): Promise<T[]> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(new Error(`按索引查询失败: ${request.error}`));
    });
  }

  /**
   * 使用游标进行高级查询
   */
  static async query<T>(
    storeName: string,
    filter?: (item: T) => boolean,
    orderBy?: { field: string; direction: 'asc' | 'desc' }
  ): Promise<T[]> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      
      const results: T[] = [];
      const request = store.openCursor();

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          const item = cursor.value as T;
          if (!filter || filter(item)) {
            results.push(item);
          }
          cursor.continue();
        } else {
          // 排序
          if (orderBy) {
            results.sort((a: any, b: any) => {
              const aVal = a[orderBy.field];
              const bVal = b[orderBy.field];
              if (orderBy.direction === 'asc') {
                return aVal > bVal ? 1 : -1;
              }
              return aVal < bVal ? 1 : -1;
            });
          }
          resolve(results);
        }
      };

      request.onerror = () => reject(new Error(`查询失败: ${request.error}`));
    });
  }

  /**
   * 清空表
   */
  static async clear(storeName: string): Promise<void> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error(`清空表失败: ${request.error}`));
    });
  }

  /**
   * 统计数量
   */
  static async count(storeName: string): Promise<number> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.count();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error(`统计失败: ${request.error}`));
    });
  }
}

/**
 * 生成 UUID
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * 导出数据（用于备份）
 */
export async function exportData(): Promise<string> {
  const data: Record<string, any[]> = {};

  for (const storeName of Object.values(STORES)) {
    data[storeName] = await IndexedDBHelper.getAll(storeName);
  }

  return JSON.stringify(data, null, 2);
}

/**
 * 导入数据（用于恢复）
 */
export async function importData(jsonData: string): Promise<void> {
  const data = JSON.parse(jsonData);

  for (const [storeName, items] of Object.entries(data)) {
    if (Object.values(STORES).includes(storeName)) {
      await IndexedDBHelper.clear(storeName);
      for (const item of items as any[]) {
        await IndexedDBHelper.add(storeName, item);
      }
    }
  }
}
