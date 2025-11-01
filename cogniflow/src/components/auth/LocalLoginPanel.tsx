/**
 * 本地登录面板组件
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLocalAuth, type LoginUserData } from '@/db/localAuth';
import { RegisterPanel } from './RegisterPanel';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';

interface LocalLoginPanelProps {
  title?: string;
  desc?: string;
  privacyPolicyUrl?: string;
  userPolicyUrl?: string;
  showPolicy?: string;
  policyPrefix?: string;
}

export function LocalLoginPanel({
  title = 'CogniFlow',
  desc = '智能流笔记 - 你只管记录,我负责管理',
  privacyPolicyUrl,
  userPolicyUrl,
  showPolicy,
  policyPrefix
}: LocalLoginPanelProps) {
  // 登录表单状态
  const [loginForm, setLoginForm] = useState<LoginUserData>({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'password' | 'quick' | 'register'>('password');
  
  // 快速登录状态（保持向后兼容）
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const { login, loginWithPassword, isAuthenticated } = useLocalAuth();
  const navigate = useNavigate();

  // 如果已经登录，直接跳转到首页
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  // 密码登录处理
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginForm.username && !loginForm.email) {
      toast.error('请输入用户名或邮箱');
      return;
    }

    if (!loginForm.password) {
      toast.error('请输入密码');
      return;
    }

    setLoading(true);
    try {
      await loginWithPassword(loginForm);
      toast.success('登录成功');
      navigate('/');
    } catch (error) {
      console.error('登录失败:', error);
      const errorMessage = error instanceof Error ? error.message : '登录失败，请重试';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 快速登录处理（保持向后兼容）
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phone && !email) {
      toast.error('请输入手机号或邮箱');
      return;
    }

    setLoading(true);
    try {
      await login(phone || undefined, email || undefined);
      toast.success('登录成功');
      navigate('/');
    } catch (error) {
      console.error('登录失败:', error);
      toast.error('登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async () => {
    setLoading(true);
    try {
      // 使用默认用户直接登录
      await login();
      toast.success('登录成功');
      navigate('/');
    } catch (error) {
      console.error('快速登录失败:', error);
      toast.error('登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 处理输入变化
  const handleInputChange = (field: keyof LoginUserData, value: string) => {
    setLoginForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">{title}</CardTitle>
        <p className="text-sm text-muted-foreground">{desc}</p>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="password">密码登录</TabsTrigger>
            <TabsTrigger value="quick">快速登录</TabsTrigger>
            <TabsTrigger value="register">注册</TabsTrigger>
          </TabsList>

          {/* 密码登录 */}
          <TabsContent value="password" className="space-y-4">
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-username">用户名或邮箱</Label>
                <Input
                  id="login-username"
                  type="text"
                  placeholder="请输入用户名或邮箱"
                  value={loginForm.username || ''}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password">密码</Label>
                <div className="relative">
                  <Input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="请输入密码"
                    value={loginForm.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    disabled={loading}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? '登录中...' : '登录'}
              </Button>
            </form>
          </TabsContent>

          {/* 快速登录 */}
          <TabsContent value="quick" className="space-y-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">手机号（可选）</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="请输入手机号"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={loading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">邮箱（可选）</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="请输入邮箱"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? '登录中...' : '登录'}
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={loading}
                  onClick={handleQuickLogin}
                >
                  {loading ? '登录中...' : '快速登录（使用默认用户）'}
                </Button>
              </div>
            </form>
          </TabsContent>

          {/* 注册 */}
          <TabsContent value="register" className="space-y-4">
            <RegisterPanel 
              onBackToLogin={() => setActiveTab('password')}
            />
          </TabsContent>
        </Tabs>

        {showPolicy === 'true' && (privacyPolicyUrl || userPolicyUrl) && (
          <div className="text-xs text-muted-foreground text-center mt-4">
            {policyPrefix && <span>{policyPrefix} </span>}
            {privacyPolicyUrl && (
              <a
                href={privacyPolicyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline hover:no-underline"
              >
                隐私政策
              </a>
            )}
            {privacyPolicyUrl && userPolicyUrl && <span> 和 </span>}
            {userPolicyUrl && (
              <a
                href={userPolicyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline hover:no-underline"
              >
                用户协议
              </a>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}