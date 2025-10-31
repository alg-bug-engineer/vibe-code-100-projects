/**
 * 本地登录面板组件
 * 替代 miaoda-auth-react 的 LoginPanel
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLocalAuth } from '@/db/localAuth';
import { toast } from 'sonner';

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
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated } = useLocalAuth();
  const navigate = useNavigate();

  // 如果已经登录，直接跳转到首页
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

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

  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">{title}</CardTitle>
        <p className="text-sm text-muted-foreground">{desc}</p>
      </CardHeader>
      <CardContent>
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

          {showPolicy === 'true' && (privacyPolicyUrl || userPolicyUrl) && (
            <div className="text-xs text-muted-foreground text-center">
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
        </form>
      </CardContent>
    </Card>
  );
}