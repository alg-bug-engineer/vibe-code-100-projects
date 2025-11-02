/**
 * 模板 API
 * 提供用户模板的 CRUD 操作
 */

import type { UserTemplate, TemplateFormData } from '@/types/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// 获取认证 token
function getAuthToken(): string | null {
  return localStorage.getItem('cogniflow_auth_token');
}

// 创建请求头
function getHeaders(): HeadersInit {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

export const templateApi = {
  /**
   * 获取所有模板
   */
  async getAll(): Promise<UserTemplate[]> {
    const response = await fetch(`${API_BASE_URL}/templates`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error('获取模板失败');
    }

    return response.json();
  },

  /**
   * 获取单个模板
   */
  async getById(id: string): Promise<UserTemplate> {
    const response = await fetch(`${API_BASE_URL}/templates/${id}`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error('获取模板失败');
    }

    return response.json();
  },

  /**
   * 创建新模板
   */
  async create(data: TemplateFormData): Promise<UserTemplate> {
    const response = await fetch(`${API_BASE_URL}/templates`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '创建模板失败');
    }

    return response.json();
  },

  /**
   * 更新模板
   */
  async update(id: string, data: Partial<TemplateFormData>): Promise<UserTemplate> {
    const response = await fetch(`${API_BASE_URL}/templates/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '更新模板失败');
    }

    return response.json();
  },

  /**
   * 删除模板
   */
  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/templates/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error('删除模板失败');
    }
  },

  /**
   * 增加模板使用次数
   */
  async incrementUsage(id: string): Promise<number> {
    const response = await fetch(`${API_BASE_URL}/templates/${id}/increment-usage`, {
      method: 'POST',
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error('更新使用次数失败');
    }

    const data = await response.json();
    return data.usage_count;
  },
};
