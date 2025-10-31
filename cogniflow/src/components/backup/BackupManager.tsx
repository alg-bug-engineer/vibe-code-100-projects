/**
 * 备份管理组件
 * 提供手动备份、恢复和配置功能
 */

import { useState, useEffect } from 'react';
import { autoBackupService, type BackupConfig } from '@/services/autoBackup';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Download, Upload, Trash2, RefreshCw, Settings, Database } from 'lucide-react';

export default function BackupManager() {
  const [config, setConfig] = useState<BackupConfig>(autoBackupService.getConfig());
  const [backups, setBackups] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [selectedBackupId, setSelectedBackupId] = useState<string | null>(null);

  useEffect(() => {
    loadBackups();
    loadStats();
  }, []);

  const loadBackups = () => {
    const allBackups = autoBackupService.getBackups();
    setBackups(allBackups);
  };

  const loadStats = () => {
    const backupStats = autoBackupService.getStats();
    setStats(backupStats);
  };

  const handleConfigChange = (key: keyof BackupConfig, value: any) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    autoBackupService.saveConfig(newConfig);
    toast.success('配置已保存');
    loadStats();
  };

  const handleManualBackup = async () => {
    setIsBackingUp(true);
    try {
      const backup = await autoBackupService.performBackup();
      if (backup) {
        toast.success('备份成功');
        loadBackups();
        loadStats();
      } else {
        toast.error('备份失败');
      }
    } catch (error) {
      toast.error('备份失败: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleDownloadBackup = (backupId: string) => {
    try {
      const data = autoBackupService.getBackupData(backupId);
      if (!data) {
        toast.error('备份数据不存在');
        return;
      }

      const backup = backups.find(b => b.id === backupId);
      if (!backup) return;

      autoBackupService.downloadBackup({
        ...backup,
        data,
      });

      toast.success('备份已下载');
    } catch (error) {
      toast.error('下载失败: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  const handleDeleteBackup = (backupId: string) => {
    try {
      autoBackupService.deleteBackup(backupId);
      toast.success('备份已删除');
      loadBackups();
      loadStats();
    } catch (error) {
      toast.error('删除失败: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  const handleRestoreConfirm = async () => {
    if (!selectedBackupId) return;

    try {
      const success = await autoBackupService.restoreFromBackup(selectedBackupId);
      if (success) {
        toast.success('数据恢复成功，页面将在3秒后刷新');
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      } else {
        toast.error('数据恢复失败');
      }
    } catch (error) {
      toast.error('恢复失败: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setRestoreDialogOpen(false);
      setSelectedBackupId(null);
    }
  };

  const handleRestoreFromFile = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const success = await autoBackupService.restoreFromFile(file);
        if (success) {
          toast.success('数据恢复成功，页面将在3秒后刷新');
          setTimeout(() => {
            window.location.reload();
          }, 3000);
        } else {
          toast.error('数据恢复失败');
        }
      } catch (error) {
        toast.error('恢复失败: ' + (error instanceof Error ? error.message : String(error)));
      }
    };
    input.click();
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            备份统计
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">备份总数</div>
                <div className="text-2xl font-bold">{stats.totalBackups}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">总大小</div>
                <div className="text-2xl font-bold">{stats.totalSize}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">最后备份</div>
                <div className="text-sm font-medium">{stats.lastBackup}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">状态</div>
                <div className={`text-sm font-medium ${stats.config.enabled ? 'text-green-600' : 'text-gray-400'}`}>
                  {stats.config.enabled ? '已启用' : '已禁用'}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 配置卡片 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            备份设置
          </CardTitle>
          <CardDescription>
            配置自动备份行为，数据将保存到浏览器本地存储
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>启用自动备份</Label>
              <div className="text-sm text-muted-foreground">
                定期自动备份数据到本地
              </div>
            </div>
            <Switch
              checked={config.enabled}
              onCheckedChange={(checked) => handleConfigChange('enabled', checked)}
            />
          </div>

          <div className="space-y-2">
            <Label>备份间隔（分钟）</Label>
            <Input
              type="number"
              min={5}
              max={1440}
              value={config.intervalMinutes}
              onChange={(e) => handleConfigChange('intervalMinutes', Number(e.target.value))}
              disabled={!config.enabled}
            />
            <div className="text-sm text-muted-foreground">
              建议设置为 30-60 分钟
            </div>
          </div>

          <div className="space-y-2">
            <Label>保留备份数量</Label>
            <Input
              type="number"
              min={1}
              max={20}
              value={config.maxBackups}
              onChange={(e) => handleConfigChange('maxBackups', Number(e.target.value))}
            />
            <div className="text-sm text-muted-foreground">
              只保留最近的 N 个备份
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>自动下载到文件</Label>
              <div className="text-sm text-muted-foreground">
                每次备份时自动下载到本地文件系统
              </div>
            </div>
            <Switch
              checked={config.autoDownload}
              onCheckedChange={(checked) => handleConfigChange('autoDownload', checked)}
              disabled={!config.enabled}
            />
          </div>
        </CardContent>
      </Card>

      {/* 操作卡片 */}
      <Card>
        <CardHeader>
          <CardTitle>备份操作</CardTitle>
          <CardDescription>
            手动备份或从备份恢复数据
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            onClick={handleManualBackup}
            disabled={isBackingUp}
            className="w-full"
          >
            {isBackingUp ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                备份中...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                立即备份
              </>
            )}
          </Button>

          <Button
            onClick={handleRestoreFromFile}
            variant="outline"
            className="w-full"
          >
            <Upload className="h-4 w-4 mr-2" />
            从文件恢复
          </Button>
        </CardContent>
      </Card>

      {/* 备份列表 */}
      <Card>
        <CardHeader>
          <CardTitle>备份历史</CardTitle>
          <CardDescription>
            管理现有的备份记录
          </CardDescription>
        </CardHeader>
        <CardContent>
          {backups.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              暂无备份记录
            </div>
          ) : (
            <div className="space-y-2">
              {backups.map((backup) => (
                <div
                  key={backup.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="font-medium">{formatDate(backup.timestamp)}</div>
                    <div className="text-sm text-muted-foreground">
                      大小: {formatSize(backup.size)} · ID: {backup.id}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownloadBackup(backup.id)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedBackupId(backup.id);
                        setRestoreDialogOpen(true);
                      }}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteBackup(backup.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 恢复确认对话框 */}
      <AlertDialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认恢复数据？</AlertDialogTitle>
            <AlertDialogDescription>
              此操作将使用备份数据覆盖当前所有数据。这个操作无法撤销，建议在恢复前先进行一次备份。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleRestoreConfirm}>
              确认恢复
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
