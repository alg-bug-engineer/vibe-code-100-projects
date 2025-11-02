/**
 * 用户注册组件
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/db/apiAdapter';
import type { RegisterUserData } from '@/db/localAuth';
import { toast } from 'sonner';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';

interface RegisterPanelProps {
  title?: string;
  desc?: string;
  onBackToLogin?: () => void;
}

export function RegisterPanel({
  title = 'CogniFlow 注册',
  desc = '创建您的账户，开始智能流笔记之旅',
  onBackToLogin
}: RegisterPanelProps) {
  const [formData, setFormData] = useState<RegisterUserData>({
    username: '',
    email: '',
    phone: '',
    password: ''
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // 如果已经登录，直接跳转到首页
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  // 表单验证
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // 用户名验证
    if (!formData.username) {
      newErrors.username = '请输入用户名';
    } else if (formData.username.length < 3) {
      newErrors.username = '用户名至少需要3个字符';
    } else if (!/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/.test(formData.username)) {
      newErrors.username = '用户名只能包含字母、数字、下划线和中文';
    }

    // 邮箱验证
    if (!formData.email) {
      newErrors.email = '请输入邮箱';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '请输入有效的邮箱地址';
    }

    // 手机号验证（可选）
    if (formData.phone && !/^1[3-9]\d{9}$/.test(formData.phone)) {
      newErrors.phone = '请输入有效的手机号';
    }

    // 密码验证
    if (!formData.password) {
      newErrors.password = '请输入密码';
    } else if (formData.password.length < 6) {
      newErrors.password = '密码至少需要6个字符';
    } else if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = '密码需要包含字母和数字';
    }

    // 确认密码验证
    if (!confirmPassword) {
      newErrors.confirmPassword = '请确认密码';
    } else if (confirmPassword !== formData.password) {
      newErrors.confirmPassword = '两次输入的密码不一致';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 处理输入变化
  const handleInputChange = (field: keyof RegisterUserData | 'confirmPassword', value: string) => {
    if (field === 'confirmPassword') {
      setConfirmPassword(value);
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }

    // 清除对应字段的错误
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // 处理注册
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await register({
        username: formData.username,
        email: formData.email,
        phone: formData.phone || undefined,
        password: formData.password
      });

      toast.success('注册成功！欢迎使用 CogniFlow');
      navigate('/');
    } catch (error) {
      console.error('注册失败:', error);
      const errorMessage = error instanceof Error ? error.message : '注册失败，请重试';
      toast.error(errorMessage);
      
      // 根据错误信息设置具体的字段错误
      if (errorMessage.includes('用户名')) {
        setErrors(prev => ({ ...prev, username: errorMessage }));
      } else if (errorMessage.includes('邮箱')) {
        setErrors(prev => ({ ...prev, email: errorMessage }));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
          {onBackToLogin && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onBackToLogin}
              className="absolute left-4"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          {title}
        </CardTitle>
        <p className="text-sm text-muted-foreground">{desc}</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleRegister} className="space-y-4">
          {/* 用户名 */}
          <div className="space-y-2">
            <Label htmlFor="username">
              用户名 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="username"
              type="text"
              placeholder="请输入用户名（3-20个字符）"
              value={formData.username}
              onChange={(e) => handleInputChange('username', e.target.value)}
              disabled={loading}
              className={errors.username ? 'border-red-500' : ''}
            />
            {errors.username && (
              <p className="text-sm text-red-500">{errors.username}</p>
            )}
          </div>

          {/* 邮箱 */}
          <div className="space-y-2">
            <Label htmlFor="email">
              邮箱 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="请输入邮箱地址"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              disabled={loading}
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email}</p>
            )}
          </div>

          {/* 手机号（可选） */}
          <div className="space-y-2">
            <Label htmlFor="phone">手机号（可选）</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="请输入手机号"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              disabled={loading}
              className={errors.phone ? 'border-red-500' : ''}
            />
            {errors.phone && (
              <p className="text-sm text-red-500">{errors.phone}</p>
            )}
          </div>

          {/* 密码 */}
          <div className="space-y-2">
            <Label htmlFor="password">
              密码 <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="请输入密码（至少6位，包含字母和数字）"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                disabled={loading}
                className={errors.password ? 'border-red-500 pr-10' : 'pr-10'}
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
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password}</p>
            )}
          </div>

          {/* 确认密码 */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">
              确认密码 <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="请再次输入密码"
                value={confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                disabled={loading}
                className={errors.confirmPassword ? 'border-red-500 pr-10' : 'pr-10'}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                tabIndex={-1}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {errors.confirmPassword && (
              <p className="text-sm text-red-500">{errors.confirmPassword}</p>
            )}
          </div>

          {/* 密码强度提示 */}
          {formData.password && (
            <Alert>
              <AlertDescription className="text-xs">
                <div className="space-y-1">
                  <div className={`flex items-center gap-2 ${
                    formData.password.length >= 6 ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    <div className={`h-1 w-1 rounded-full ${
                      formData.password.length >= 6 ? 'bg-green-600' : 'bg-gray-300'
                    }`} />
                    至少6个字符
                  </div>
                  <div className={`flex items-center gap-2 ${
                    /(?=.*[a-zA-Z])(?=.*\d)/.test(formData.password) ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    <div className={`h-1 w-1 rounded-full ${
                      /(?=.*[a-zA-Z])(?=.*\d)/.test(formData.password) ? 'bg-green-600' : 'bg-gray-300'
                    }`} />
                    包含字母和数字
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* 注册按钮 */}
          <div className="space-y-2">
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? '注册中...' : '注册'}
            </Button>
          </div>

          {/* 登录链接 */}
          <div className="text-center text-sm">
            <span className="text-muted-foreground">已有账户？</span>
            {onBackToLogin ? (
              <Button
                variant="link"
                className="p-0 h-auto font-normal"
                onClick={onBackToLogin}
              >
                立即登录
              </Button>
            ) : (
              <Link
                to="/login"
                className="text-primary hover:underline ml-1"
              >
                立即登录
              </Link>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}