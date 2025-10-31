/**
 * 自动备份服务
 * 定期将 IndexedDB 数据导出到本地文件，防止数据丢失
 */

import { exportData } from '@/db/indexeddb';

// 备份配置
export interface BackupConfig {
  enabled: boolean;
  intervalMinutes: number; // 备份间隔（分钟）
  maxBackups: number; // 保留的最大备份数量
  autoDownload: boolean; // 是否自动下载到文件系统
}

// 默认配置
const DEFAULT_CONFIG: BackupConfig = {
  enabled: true,
  intervalMinutes: 30, // 每30分钟备份一次
  maxBackups: 10, // 保留最近10个备份
  autoDownload: false, // 默认只保存到 localStorage
};

// 备份记录
interface BackupRecord {
  id: string;
  timestamp: string;
  size: number;
  data: string;
  version: string;
}

// 本地存储 keys
const STORAGE_KEYS = {
  CONFIG: 'cogniflow_backup_config',
  BACKUPS: 'cogniflow_backups',
  LAST_BACKUP: 'cogniflow_last_backup',
};

class AutoBackupService {
  private intervalId: number | null = null;
  private config: BackupConfig;

  constructor() {
    this.config = this.loadConfig();
  }

  /**
   * 加载配置
   */
  private loadConfig(): BackupConfig {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CONFIG);
      if (saved) {
        return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.error('加载备份配置失败:', error);
    }
    return DEFAULT_CONFIG;
  }

  /**
   * 保存配置
   */
  saveConfig(config: Partial<BackupConfig>): void {
    this.config = { ...this.config, ...config };
    try {
      localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(this.config));
      console.log('备份配置已保存:', this.config);
      
      // 如果配置改变，重启服务
      if (this.intervalId) {
        this.stop();
        if (this.config.enabled) {
          this.start();
        }
      }
    } catch (error) {
      console.error('保存备份配置失败:', error);
    }
  }

  /**
   * 获取当前配置
   */
  getConfig(): BackupConfig {
    return { ...this.config };
  }

  /**
   * 开始自动备份
   */
  start(): void {
    if (this.intervalId) {
      console.warn('自动备份已在运行中');
      return;
    }

    if (!this.config.enabled) {
      console.log('自动备份未启用');
      return;
    }

    console.log(`开始自动备份，间隔: ${this.config.intervalMinutes} 分钟`);

    // 立即执行一次备份
    this.performBackup();

    // 设置定时备份
    this.intervalId = window.setInterval(
      () => this.performBackup(),
      this.config.intervalMinutes * 60 * 1000
    );
  }

  /**
   * 停止自动备份
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('自动备份已停止');
    }
  }

  /**
   * 执行备份
   */
  async performBackup(): Promise<BackupRecord | null> {
    try {
      console.log('开始备份数据...');
      const startTime = performance.now();

      // 导出数据
      const data = await exportData();
      const size = new Blob([data]).size;

      // 创建备份记录
      const backup: BackupRecord = {
        id: this.generateBackupId(),
        timestamp: new Date().toISOString(),
        size,
        data,
        version: '1.0',
      };

      // 保存到 localStorage
      this.saveBackup(backup);

      // 如果启用自动下载，下载到文件系统
      if (this.config.autoDownload) {
        this.downloadBackup(backup);
      }

      const endTime = performance.now();
      console.log(`备份完成，耗时: ${(endTime - startTime).toFixed(2)}ms，大小: ${this.formatSize(size)}`);

      // 更新最后备份时间
      localStorage.setItem(STORAGE_KEYS.LAST_BACKUP, backup.timestamp);

      return backup;
    } catch (error) {
      console.error('备份失败:', error);
      return null;
    }
  }

  /**
   * 保存备份到 localStorage
   */
  private saveBackup(backup: BackupRecord): void {
    try {
      // 获取现有备份
      const backups = this.getBackups();

      // 添加新备份
      backups.unshift(backup);

      // 限制备份数量
      const trimmedBackups = backups.slice(0, this.config.maxBackups);

      // 保存（使用压缩存储，只保留元数据，数据单独存储）
      const metadata = trimmedBackups.map(b => ({
        id: b.id,
        timestamp: b.timestamp,
        size: b.size,
        version: b.version,
      }));

      localStorage.setItem(STORAGE_KEYS.BACKUPS, JSON.stringify(metadata));

      // 保存最新的完整备份数据
      localStorage.setItem(`backup_${backup.id}`, backup.data);

      // 清理旧备份数据
      if (backups.length > this.config.maxBackups) {
        const oldBackups = backups.slice(this.config.maxBackups);
        for (const old of oldBackups) {
          localStorage.removeItem(`backup_${old.id}`);
        }
      }

      console.log(`备份已保存: ${backup.id}`);
    } catch (error) {
      console.error('保存备份失败:', error);
      // 如果 localStorage 满了，尝试清理旧备份
      this.cleanupOldBackups();
      throw error;
    }
  }

  /**
   * 获取所有备份元数据
   */
  getBackups(): BackupRecord[] {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BACKUPS);
      if (!saved) return [];

      const metadata = JSON.parse(saved);
      return metadata.map((meta: any) => ({
        ...meta,
        data: '', // 不加载完整数据
      }));
    } catch (error) {
      console.error('获取备份列表失败:', error);
      return [];
    }
  }

  /**
   * 获取特定备份的完整数据
   */
  getBackupData(backupId: string): string | null {
    try {
      return localStorage.getItem(`backup_${backupId}`);
    } catch (error) {
      console.error('获取备份数据失败:', error);
      return null;
    }
  }

  /**
   * 下载备份到文件系统
   */
  downloadBackup(backup: BackupRecord): void {
    try {
      const blob = new Blob([backup.data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cogniflow_backup_${backup.id}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      console.log(`备份已下载: ${a.download}`);
    } catch (error) {
      console.error('下载备份失败:', error);
    }
  }

  /**
   * 从文件恢复数据
   */
  async restoreFromFile(file: File): Promise<boolean> {
    try {
      const text = await file.text();
      return await this.restoreFromData(text);
    } catch (error) {
      console.error('从文件恢复失败:', error);
      return false;
    }
  }

  /**
   * 从备份数据恢复
   */
  async restoreFromData(data: string): Promise<boolean> {
    try {
      console.log('开始恢复数据...');
      
      // 验证数据格式
      JSON.parse(data);

      // 导入数据
      const { importData } = await import('@/db/indexeddb');
      await importData(data);

      console.log('数据恢复成功');
      return true;
    } catch (error) {
      console.error('恢复数据失败:', error);
      return false;
    }
  }

  /**
   * 从备份 ID 恢复
   */
  async restoreFromBackup(backupId: string): Promise<boolean> {
    const data = this.getBackupData(backupId);
    if (!data) {
      console.error('备份数据不存在:', backupId);
      return false;
    }
    return await this.restoreFromData(data);
  }

  /**
   * 删除备份
   */
  deleteBackup(backupId: string): void {
    try {
      const backups = this.getBackups();
      const filtered = backups.filter(b => b.id !== backupId);

      const metadata = filtered.map(b => ({
        id: b.id,
        timestamp: b.timestamp,
        size: b.size,
        version: b.version,
      }));

      localStorage.setItem(STORAGE_KEYS.BACKUPS, JSON.stringify(metadata));
      localStorage.removeItem(`backup_${backupId}`);

      console.log(`备份已删除: ${backupId}`);
    } catch (error) {
      console.error('删除备份失败:', error);
    }
  }

  /**
   * 清理旧备份
   */
  private cleanupOldBackups(): void {
    try {
      const backups = this.getBackups();
      if (backups.length <= 1) return;

      // 只保留最新的备份
      const toDelete = backups.slice(1);

      for (const backup of toDelete) {
        this.deleteBackup(backup.id);
      }

      console.log(`已清理 ${toDelete.length} 个旧备份`);
    } catch (error) {
      console.error('清理备份失败:', error);
    }
  }

  /**
   * 获取最后备份时间
   */
  getLastBackupTime(): string | null {
    return localStorage.getItem(STORAGE_KEYS.LAST_BACKUP);
  }

  /**
   * 生成备份 ID
   */
  private generateBackupId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 格式化文件大小
   */
  private formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  /**
   * 获取备份统计信息
   */
  getStats() {
    const backups = this.getBackups();
    const lastBackup = this.getLastBackupTime();
    const totalSize = backups.reduce((sum, b) => sum + b.size, 0);

    return {
      totalBackups: backups.length,
      totalSize: this.formatSize(totalSize),
      lastBackup: lastBackup ? new Date(lastBackup).toLocaleString('zh-CN') : '从未备份',
      config: this.config,
    };
  }
}

// 导出单例
export const autoBackupService = new AutoBackupService();
