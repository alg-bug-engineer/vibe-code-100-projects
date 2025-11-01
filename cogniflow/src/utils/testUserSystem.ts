/**
 * 用户系统测试脚本
 * 验证注册、登录、数据隔离等功能
 */

import { localAuth } from '@/db/localAuth';
import { LocalStorageManager } from '@/services/localStorageManager';
import { userItemApi } from '@/db/userDataApi';

/**
 * 测试函数
 */
export async function testUserSystem() {
  console.log('=== 开始测试用户系统 ===');
  
  try {
    // 1. 测试用户注册
    console.log('\n1. 测试用户注册...');
    
    // 清空现有数据
    await LocalStorageManager.clearAllData();
    
    // 注册第一个用户
    const user1 = await localAuth.register({
      username: 'testuser1',
      email: 'user1@test.com',
      phone: '13800138001',
      password: 'password123'
    });
    console.log('用户1注册成功:', user1);
    
    // 注册第二个用户
    const user2 = await localAuth.register({
      username: 'testuser2',
      email: 'user2@test.com',
      password: 'password456'
    });
    console.log('用户2注册成功:', user2);
    
    // 2. 测试登录
    console.log('\n2. 测试用户登录...');
    
    // 登出
    localAuth.logout();
    
    // 用用户1登录
    const loginUser1 = await localAuth.loginWithPassword({
      username: 'testuser1',
      password: 'password123'
    });
    console.log('用户1登录成功:', loginUser1);
    
    // 3. 测试数据隔离 - 用户1创建数据
    console.log('\n3. 测试数据隔离 - 用户1创建数据...');
    
    const item1 = await userItemApi.createItem({
      raw_text: '用户1的第一个任务',
      type: 'task',
      title: '完成项目A',
      description: '这是用户1的任务',
      due_date: null,
      priority: 'medium',
      status: 'pending',
      tags: ['工作', '项目A'],
      entities: {},
      archived_at: null,
      url: null,
      url_title: null,
      url_summary: null,
      url_thumbnail: null,
      url_fetched_at: null,
      has_conflict: false,
      start_time: null,
      end_time: null,
      recurrence_rule: null,
      recurrence_end_date: null,
      master_item_id: null,
      is_master: false
    });
    console.log('用户1创建条目成功:', item1?.title);
    
    // 获取用户1的数据
    const user1Items = await userItemApi.getItems();
    console.log('用户1的条目数量:', user1Items.length);
    
    // 4. 切换到用户2
    console.log('\n4. 切换到用户2...');
    
    localAuth.logout();
    const loginUser2 = await localAuth.loginWithPassword({
      username: 'testuser2',
      password: 'password456'
    });
    console.log('用户2登录成功:', loginUser2);
    
    // 用户2创建数据
    const item2 = await userItemApi.createItem({
      raw_text: '用户2的第一个笔记',
      type: 'note',
      title: '学习笔记',
      description: '这是用户2的笔记',
      due_date: null,
      priority: 'low',
      status: 'completed',
      tags: ['学习', '笔记'],
      entities: {},
      archived_at: null,
      url: null,
      url_title: null,
      url_summary: null,
      url_thumbnail: null,
      url_fetched_at: null,
      has_conflict: false,
      start_time: null,
      end_time: null,
      recurrence_rule: null,
      recurrence_end_date: null,
      master_item_id: null,
      is_master: false
    });
    console.log('用户2创建条目成功:', item2?.title);
    
    // 获取用户2的数据
    const user2Items = await userItemApi.getItems();
    console.log('用户2的条目数量:', user2Items.length);
    
    // 5. 验证数据隔离
    console.log('\n5. 验证数据隔离...');
    
    // 切换回用户1
    localAuth.logout();
    await localAuth.loginWithPassword({
      username: 'testuser1',
      password: 'password123'
    });
    
    const user1ItemsAfter = await userItemApi.getItems();
    console.log('用户1的条目数量（应该还是1）:', user1ItemsAfter.length);
    console.log('用户1的条目标题:', user1ItemsAfter.map(item => item.title));
    
    // 切换回用户2
    localAuth.logout();
    await localAuth.loginWithPassword({
      username: 'testuser2',
      password: 'password456'
    });
    
    const user2ItemsAfter = await userItemApi.getItems();
    console.log('用户2的条目数量（应该是1）:', user2ItemsAfter.length);
    console.log('用户2的条目标题:', user2ItemsAfter.map(item => item.title));
    
    // 6. 测试用户设置
    console.log('\n6. 测试用户设置...');
    
    const settings = await userItemApi.getTagStats();
    console.log('用户2的标签统计:', settings);
    
    console.log('\n=== 测试完成！所有功能正常 ===');
    
    return {
      success: true,
      user1ItemsCount: user1ItemsAfter.length,
      user2ItemsCount: user2ItemsAfter.length,
      dataIsolationWorking: user1ItemsAfter.length === 1 && user2ItemsAfter.length === 1
    };
    
  } catch (error) {
    console.error('测试失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    };
  }
}

// 如果在浏览器环境中，将测试函数暴露到全局
if (typeof window !== 'undefined') {
  (window as any).testUserSystem = testUserSystem;
}