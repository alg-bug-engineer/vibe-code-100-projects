/**
 * PostgreSQL 认证 API
 * 通过后端 API 进行用户认证
 */

import type { LocalUser, RegisterUserData, LoginUserData } from './localAuth';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

/**
 * PostgreSQL 认证类
 */
export class PostgresAuth {
  private currentUser: LocalUser | null = null;
  private token: string | null = null;
  private listeners: Array<(user: LocalUser | null) => void> = [];

  constructor() {
    this.loadStoredAuth();
  }

  /**
   * 从 localStorage 加载已保存的认证信息
   */
  private loadStoredAuth(): void {
    try {
      const token = localStorage.getItem('cogniflow_auth_token');
      const userStr = localStorage.getItem('cogniflow_current_user');
      
      if (token && userStr) {
        this.token = token;
        this.currentUser = JSON.parse(userStr);
      }
    } catch (error) {
      console.error('加载认证信息失败:', error);
      this.clearAuth();
    }
  }

  /**
   * 保存认证信息到 localStorage
   */
  private saveAuth(user: LocalUser, token: string): void {
    this.currentUser = user;
    this.token = token;
    localStorage.setItem('cogniflow_auth_token', token);
    localStorage.setItem('cogniflow_current_user', JSON.stringify(user));
    this.notifyListeners();
  }

  /**
   * 清除认证信息
   */
  private clearAuth(): void {
    this.currentUser = null;
    this.token = null;
    localStorage.removeItem('cogniflow_auth_token');
    localStorage.removeItem('cogniflow_current_user');
    this.notifyListeners();
  }

  /**
   * 通知所有监听器
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.currentUser));
  }

  /**
   * 初始化（兼容 localAuth 接口）
   */
  async initialize(): Promise<void> {
    // 如果有 token，验证是否有效
    if (this.token) {
      try {
        const response = await fetch(`${API_BASE_URL}/users/me`, {
          headers: {
            'Authorization': `Bearer ${this.token}`
          }
        });

        if (!response.ok) {
          // Token 无效，清除认证信息
          this.clearAuth();
        }
      } catch (error) {
        console.error('验证 token 失败:', error);
        // 网络错误时保留 token，不清除
      }
    }
  }

  /**
   * 用户注册
   */
  async register(userData: RegisterUserData): Promise<LocalUser> {
    try {
      console.log('📝 注册用户 (PostgreSQL):', userData.username);
      
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: userData.username,
          password: userData.password,
          email: userData.email
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '注册失败');
      }

      const data = await response.json();
      
      // 转换为 LocalUser 格式
      const user: LocalUser = {
        id: data.user.id,
        username: data.user.username,
        email: data.user.email,
        phone: null,
        role: data.user.role,
        created_at: data.user.createdAt
      };

      // 保存认证信息
      this.saveAuth(user, data.token);
      
      console.log('✅ 注册成功:', user.username);
      return user;
    } catch (error) {
      console.error('❌ 注册失败:', error);
      throw error;
    }
  }

  /**
   * 用户登录
   */
  async login(credentials: LoginUserData): Promise<LocalUser> {
    try {
      console.log('🔐 登录用户 (PostgreSQL):', credentials.username || credentials.email);
      
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: credentials.username || credentials.email,
          password: credentials.password
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '登录失败');
      }

      const data = await response.json();
      
      // 转换为 LocalUser 格式
      const user: LocalUser = {
        id: data.user.id,
        username: data.user.username,
        email: data.user.email,
        phone: null,
        role: data.user.role,
        created_at: data.user.created_at || new Date().toISOString()
      };

      // 保存认证信息
      this.saveAuth(user, data.token);
      
      console.log('✅ 登录成功:', user.username);
      return user;
    } catch (error) {
      console.error('❌ 登录失败:', error);
      throw error;
    }
  }

  /**
   * 用户登出
   */
  async logout(): Promise<void> {
    console.log('👋 用户登出 (PostgreSQL)');
    this.clearAuth();
  }

  /**
   * 获取当前用户
   */
  getCurrentUser(): LocalUser | null {
    return this.currentUser;
  }

  /**
   * 设置当前用户（兼容接口，但在 PostgreSQL 模式下不应直接使用）
   */
  setCurrentUser(user: LocalUser | null): void {
    if (user) {
      console.warn('⚠️ PostgreSQL 模式下不应直接设置用户，请使用 login() 方法');
    } else {
      this.clearAuth();
    }
  }

  /**
   * 添加用户状态监听器
   */
  addListener(listener: (user: LocalUser | null) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * 创建默认用户（PostgreSQL 模式下不支持）
   */
  async createDefaultUser(): Promise<LocalUser> {
    throw new Error('PostgreSQL 模式不支持快速登录，请先注册账号');
  }

  /**
   * 删除用户（PostgreSQL 模式下不支持）
   */
  async deleteUser(_userId: string): Promise<void> {
    throw new Error('PostgreSQL 模式不支持删除用户操作');
  }

  /**
   * 切换用户（PostgreSQL 模式下不支持）
   */
  async switchUser(_userId: string): Promise<void> {
    throw new Error('PostgreSQL 模式不支持切换用户操作，请使用登录/登出功能');
  }

  /**
   * 获取所有用户（PostgreSQL 模式下不支持）
   */
  async getAllUsers(): Promise<LocalUser[]> {
    throw new Error('PostgreSQL 模式不支持获取所有用户列表');
  }
}

// 导出单例
export const postgresAuth = new PostgresAuth();
