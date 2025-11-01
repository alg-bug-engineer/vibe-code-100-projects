/**
 * 开发者工具页面
 * 只能通过特定方式访问，不在普通用户界面中显示
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { testUserSystem } from '@/utils/testUserSystem';
import { localAuth, useLocalAuth } from '@/db/localAuth';
import { userItemApi } from '@/db/userDataApi';
import { LocalStorageManager } from '@/services/localStorageManager';
import { clearAllLocalStorage } from '@/utils/clearStorage';

export default function DevToolsPage() {
  const [testResult, setTestResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [userStats, setUserStats] = useState<any>(null);
  const [accessGranted, setAccessGranted] = useState(false);
  const { user, isAuthenticated } = useLocalAuth();
  const navigate = useNavigate();

  // 检查访问权限
  useEffect(() => {
    const hasDebugAccess = localStorage.getItem('cogniflow_debug') === 'true';
    const isDev = import.meta.env.DEV;
    const isAdmin = user?.role === 'admin';
    
    if (isDev && hasDebugAccess && isAdmin) {
      setAccessGranted(true);
      checkUserStats();
    } else {
      setAccessGranted(false);
    }
  }, [user]);

  const runTest = async () => {
    setLoading(true);
    setTestResult(null);
    try {
      const result = await testUserSystem();
      setTestResult(result);
    } catch (error) {
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : '测试失败'
      });
    } finally {
      setLoading(false);
    }
  };

  const checkUserStats = async () => {
    try {
      const allUsers = await LocalStorageManager.getAllUsers();
      const currentUserId = LocalStorageManager.getCurrentUserId();
      const items = isAuthenticated ? await userItemApi.getItems() : [];
      const tagStats = isAuthenticated ? await userItemApi.getTagStats() : {};
      
      setUserStats({
        totalUsers: allUsers.length,
        currentUserId,
        currentUserItems: items.length,
        tagStats,
        users: allUsers.map(u => ({
          id: u.id,
          username: u.username,
          email: u.email,
          createdAt: u.createdAt
        }))
      });
    } catch (error) {
      console.error('获取用户统计失败:', error);
    }
  };

  const clearAllData = async () => {
    if (!confirm('确定要清空所有数据吗？此操作不可恢复！')) {
      return;
    }

    try {
      clearAllLocalStorage();
      localAuth.logout();
      setUserStats(null);
      alert('所有数据已清空');
      window.location.reload();
    } catch (error) {
      console.error('清空数据失败:', error);
      alert('清空数据失败: ' + (error instanceof Error ? error.message : '未知错误'));
    }
  };

  if (!accessGranted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
        <div className="max-w-2xl mx-auto space-y-6">
          <Card className="border-red-200 dark:border-red-800">
            <CardHeader>
              <CardTitle className="text-red-600 dark:text-red-400">
                🚫 访问被拒绝
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertDescription>
                  <strong>此页面仅供开发者使用。</strong>
                  <br />
                  需要满足以下条件：
                  <ul className="mt-2 space-y-1">
                    <li>• 开发环境模式</li>
                    <li>• 管理员权限</li>
                    <li>• 开启调试模式</li>
                  </ul>
                </AlertDescription>
              </Alert>
              
              <div className="flex gap-2">
                <Button onClick={() => navigate('/')} variant="outline">
                  返回首页
                </Button>
                {!isAuthenticated && (
                  <Button onClick={() => navigate('/login')}>
                    去登录
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* 警告标题 */}
        <Card className="border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20">
          <CardHeader>
            <CardTitle className="text-yellow-800 dark:text-yellow-200 flex items-center gap-2">
              ⚠️ 开发者工具
              <Badge variant="destructive">危险操作</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertDescription>
                <strong>警告：</strong>此页面包含可能影响系统稳定性的调试功能。
                仅供开发和测试使用，请谨慎操作。
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* 当前用户状态 */}
        <Card>
          <CardHeader>
            <CardTitle>开发环境状态</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <Badge variant={import.meta.env.DEV ? "default" : "secondary"}>
                  {import.meta.env.DEV ? "开发模式" : "生产模式"}
                </Badge>
              </div>
              <div className="text-center">
                <Badge variant={isAuthenticated ? "default" : "secondary"}>
                  {isAuthenticated ? "已登录" : "未登录"}
                </Badge>
              </div>
              <div className="text-center">
                <Badge variant={user?.role === 'admin' ? "default" : "secondary"}>
                  {user?.role === 'admin' ? "管理员" : "普通用户"}
                </Badge>
              </div>
              <div className="text-center">
                <Badge variant="outline">
                  调试模式
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 用户统计 */}
        {userStats && (
          <Card>
            <CardHeader>
              <CardTitle>系统统计</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{userStats.totalUsers}</div>
                  <div className="text-sm text-muted-foreground">总用户数</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{userStats.currentUserItems}</div>
                  <div className="text-sm text-muted-foreground">当前用户条目</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{Object.keys(userStats.tagStats).length}</div>
                  <div className="text-sm text-muted-foreground">标签数量</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{userStats.currentUserId ? '是' : '否'}</div>
                  <div className="text-sm text-muted-foreground">有当前用户</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 测试功能 */}
        <Card className="border-red-200 dark:border-red-800">
          <CardHeader>
            <CardTitle className="text-red-600 dark:text-red-400">
              危险操作区域
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button 
                onClick={runTest} 
                disabled={loading}
                variant="destructive"
                size="sm"
              >
                {loading ? '测试中...' : '运行完整测试'}
              </Button>
              <Button 
                onClick={clearAllData} 
                variant="destructive"
                size="sm"
              >
                清空所有数据
              </Button>
              <Button 
                onClick={checkUserStats} 
                variant="outline"
                size="sm"
              >
                刷新统计
              </Button>
            </div>

            {testResult && (
              <Alert variant={testResult.success ? "default" : "destructive"}>
                <AlertDescription>
                  {testResult.success ? (
                    <div>
                      <strong>测试成功！</strong>
                      <ul className="mt-2 space-y-1">
                        <li>✅ 用户1条目数: {testResult.user1ItemsCount}</li>
                        <li>✅ 用户2条目数: {testResult.user2ItemsCount}</li>
                        <li>✅ 数据隔离: {testResult.dataIsolationWorking ? '正常' : '异常'}</li>
                      </ul>
                    </div>
                  ) : (
                    <div>
                      <strong>测试失败:</strong> {testResult.error}
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* 返回按钮 */}
        <div className="flex justify-center">
          <Button onClick={() => navigate('/')} variant="outline">
            返回首页
          </Button>
        </div>
      </div>
    </div>
  );
}