# CogniFlow 开发指南

## 📖 目录

- [项目简介](#项目简介)
- [技术栈](#技术栈)
- [项目结构](#项目结构)
- [开发环境](#开发环境)
- [核心架构](#核心架构)
- [API 配置](#api-配置)
- [数据库设计](#数据库设计)
- [开发规范](#开发规范)
- [调试指南](#调试指南)

---

## 项目简介

CogniFlow 是一款智能信息管理工具，使用 AI 自动分类和管理用户的碎片化信息。

**项目特点**：
- 🎯 纯前端应用，无需后端服务器
- 💾 使用 IndexedDB 本地存储数据
- 🤖 集成智谱 AI 提供智能处理
- ⚡ 基于 Vite + React + TypeScript

---

## 技术栈

### 核心框架
- **React 18** - UI 框架
- **TypeScript** - 类型系统
- **Vite** - 构建工具

### UI 组件
- **Tailwind CSS** - 样式框架
- **shadcn/ui** - UI 组件库
- **Radix UI** - 无障碍组件
- **Lucide React** - 图标库

### 状态管理
- **React Hooks** - 状态管理
- **React Router** - 路由管理

### 数据存储
- **IndexedDB** - 本地数据库
- **localStorage** - 配置和备份存储

### AI 服务
- **智谱 AI (GLM)** - 文本理解和生成
- **Streaming** - 流式响应处理

### 工具库
- **date-fns** - 日期处理
- **axios** - HTTP 客户端
- **sonner** - Toast 通知

---

## 项目结构

```
cogniflow/
├── src/
│   ├── components/          # React 组件
│   │   ├── backup/         # 备份管理组件
│   │   ├── calendar/       # 日历组件
│   │   ├── common/         # 通用组件
│   │   ├── items/          # 条目卡片组件
│   │   ├── query/          # 查询组件
│   │   ├── tags/           # 标签组件
│   │   ├── ui/             # UI 基础组件
│   │   └── url/            # URL 处理组件
│   │
│   ├── db/                  # 数据库层
│   │   ├── indexeddb.ts    # IndexedDB 封装
│   │   ├── localApi.ts     # 本地 API
│   │   └── localAuth.ts    # 本地认证
│   │
│   ├── services/            # 业务服务
│   │   └── autoBackup.ts   # 自动备份服务
│   │
│   ├── utils/               # 工具函数
│   │   ├── ai.ts           # AI 处理
│   │   ├── queryProcessor.ts # 查询处理
│   │   └── urlProcessor.ts # URL 处理
│   │
│   ├── types/               # 类型定义
│   │   └── types.ts        # 全局类型
│   │
│   ├── pages/               # 页面组件
│   │   ├── Dashboard.tsx   # 主仪表盘
│   │   ├── Admin.tsx       # 管理面板
│   │   └── Login.tsx       # 登录页
│   │
│   ├── hooks/               # 自定义 Hooks
│   ├── lib/                 # 库配置
│   ├── App.tsx             # 应用入口
│   ├── main.tsx            # React 挂载
│   └── routes.tsx          # 路由配置
│
├── public/                  # 静态资源
├── docs/                    # 开发文档
├── .env                     # 环境变量（本地）
├── .env.example            # 环境变量示例
├── package.json            # 项目配置
├── vite.config.ts          # Vite 配置
├── tailwind.config.js      # Tailwind 配置
├── tsconfig.json           # TypeScript 配置
└── USER_MANUAL.md          # 用户手册
```

---

## 开发环境

### 环境要求
- Node.js >= 20.x
- npm >= 10.x

### 安装依赖
```bash
npm install
```

### 环境变量配置

复制 `.env.example` 为 `.env`：
```bash
cp .env.example .env
```

配置必需的环境变量：
```env
# 智谱 AI API 配置（必需）
VITE_GLM_API_KEY=your_api_key_here
VITE_GLM_MODEL=glm-4-flash
```

### 启动开发服务器
```bash
npm run dev -- --host 127.0.0.1
```

应用将在 `http://127.0.0.1:5173` 启动。

### 构建生产版本
```bash
npm run build
```

构建产物在 `.dist/` 目录。

---

## 核心架构

### 数据流

```
用户输入
   ↓
QuickInput 组件
   ↓
AI 处理 (utils/ai.ts)
   ↓
解析结果
   ↓
本地 API (db/localApi.ts)
   ↓
IndexedDB 存储
   ↓
Dashboard 展示
```

### 认证流程

```
用户输入手机号
   ↓
本地认证 (db/localAuth.ts)
   ↓
创建/获取用户 Profile
   ↓
保存到 IndexedDB
   ↓
返回用户信息
```

### 备份流程

```
应用启动
   ↓
启动自动备份服务
   ↓
定时触发备份
   ↓
导出 IndexedDB 数据
   ↓
保存到 localStorage
   ↓
清理旧备份
```

---

## API 配置

### 智谱 AI (GLM) 集成

#### 1. 获取 API Key

访问 [智谱AI开放平台](https://open.bigmodel.cn/)，注册并创建 API Key。

#### 2. 配置环境变量

```env
VITE_GLM_API_KEY=your_api_key_here
VITE_GLM_MODEL=glm-4-flash
```

#### 3. API 调用

在 `src/utils/ai.ts` 中：

```typescript
import { GLM_CONFIG } from './config';

export async function processWithAI(text: string) {
  const response = await fetch(GLM_CONFIG.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GLM_CONFIG.apiKey}`,
    },
    body: JSON.stringify({
      model: GLM_CONFIG.model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: text }
      ],
      stream: true,
    }),
  });
  
  // 处理流式响应
  return parseStreamResponse(response);
}
```

#### 4. 错误处理

```typescript
try {
  const result = await processWithAI(text);
} catch (error) {
  console.error('AI 处理失败:', error);
  // 降级处理
  return createDefaultItem(text);
}
```

---

## 数据库设计

### IndexedDB 表结构

#### 1. profiles 表
```typescript
interface Profile {
  id: string;              // UUID
  phone: string | null;    // 手机号
  email: string | null;    // 邮箱
  role: 'user' | 'admin';  // 角色
  created_at: string;      // 创建时间
}

// 索引
- id (主键)
- phone (唯一)
- email (唯一)
```

#### 2. items 表
```typescript
interface Item {
  id: string;                // UUID
  user_id: string;          // 用户 ID
  raw_text: string;         // 原始输入
  type: ItemType;           // 类型
  title: string | null;     // 标题
  description: string | null; // 描述
  due_date: string | null;  // 截止日期
  priority: string;         // 优先级
  status: string;           // 状态
  tags: string[];           // 标签数组
  entities: Record<string, any>; // 实体信息
  created_at: string;       // 创建时间
  updated_at: string;       // 更新时间
  archived_at: string | null; // 归档时间
  
  // URL 相关
  url: string | null;
  url_title: string | null;
  url_summary: string | null;
  url_thumbnail: string | null;
  url_fetched_at: string | null;
  
  // 重复日程相关
  start_time: string | null;
  end_time: string | null;
  recurrence_rule: string | null;
  recurrence_end_date: string | null;
  master_item_id: string | null;
  is_master: boolean;
  has_conflict: boolean;
}

// 索引
- id (主键)
- user_id
- type
- status
- created_at
- due_date
- archived_at
```

#### 3. tags 表
```typescript
interface TagStats {
  name: string;   // 标签名（主键）
  count: number;  // 使用次数
}

// 索引
- name (主键)
- count
```

### 数据操作

#### 增删改查封装
```typescript
// 添加
await IndexedDBHelper.add(STORES.ITEMS, item);

// 更新
await IndexedDBHelper.update(STORES.ITEMS, updatedItem);

// 删除
await IndexedDBHelper.delete(STORES.ITEMS, itemId);

// 查询单条
const item = await IndexedDBHelper.getById(STORES.ITEMS, itemId);

// 查询所有
const items = await IndexedDBHelper.getAll(STORES.ITEMS);

// 条件查询
const items = await IndexedDBHelper.query(
  STORES.ITEMS,
  (item) => item.user_id === userId && item.type === 'task'
);
```

---

## 开发规范

### 代码风格

项目使用 **Biome** 进行代码检查和格式化。

```bash
# 检查代码
npm run lint

# 自动修复
npm run lint:fix
```

### TypeScript 规范

1. **严格类型检查**
   ```typescript
   // ✅ 正确
   const item: Item = { ... };
   
   // ❌ 错误
   const item: any = { ... };
   ```

2. **接口定义**
   ```typescript
   // 在 src/types/types.ts 中定义
   export interface NewType {
     id: string;
     name: string;
   }
   ```

3. **类型导入**
   ```typescript
   import type { Item, Profile } from '@/types/types';
   ```

### 组件规范

1. **函数组件**
   ```typescript
   export default function ComponentName() {
     return <div>...</div>;
   }
   ```

2. **Props 类型**
   ```typescript
   interface ComponentProps {
     title: string;
     onClose: () => void;
   }
   
   export default function Component({ title, onClose }: ComponentProps) {
     // ...
   }
   ```

3. **Hooks 使用**
   ```typescript
   const [state, setState] = useState<Type>(initialValue);
   
   useEffect(() => {
     // effect
     return () => {
       // cleanup
     };
   }, [dependencies]);
   ```

### 文件命名

- 组件文件：`PascalCase.tsx`
- 工具文件：`camelCase.ts`
- 类型文件：`types.ts`
- 样式文件：`kebab-case.css`

---

## 调试指南

### 开发者工具

#### 1. React DevTools
安装 React DevTools 浏览器扩展，查看组件树和状态。

#### 2. IndexedDB 查看
在浏览器 DevTools 中：
```
Application → Storage → IndexedDB → CogniFlowDB
```

#### 3. localStorage 查看
```
Application → Storage → Local Storage
```

### 常见问题

#### 1. IndexedDB 初始化失败
**症状**：应用启动时卡在初始化页面

**解决**：
1. 清除浏览器 IndexedDB
2. 重启浏览器
3. 检查浏览器是否支持 IndexedDB

#### 2. AI 处理失败
**症状**：输入后一直显示"处理中"

**解决**：
1. 检查 `.env` 中的 API Key 是否正确
2. 检查网络连接
3. 查看浏览器控制台错误信息
4. 确认 API 额度是否充足

#### 3. 备份失败
**症状**：手动备份时提示失败

**解决**：
1. 检查 localStorage 空间是否充足
2. 清理旧备份
3. 查看控制台错误日志

### 日志调试

在关键位置添加日志：
```typescript
console.log('数据:', data);
console.error('错误:', error);
console.warn('警告:', warning);
```

生产环境移除 console：
```typescript
if (import.meta.env.DEV) {
  console.log('调试信息');
}
```

---

## 部署指南

详见 [DEPLOYMENT_CHECKLIST.md](../DEPLOYMENT_CHECKLIST.md)

---

## 贡献指南

### 开发流程

1. Fork 项目
2. 创建特性分支
3. 提交变更
4. 推送到分支
5. 创建 Pull Request

### Commit 规范

```
feat: 新功能
fix: 修复 bug
docs: 文档更新
style: 代码格式调整
refactor: 重构
test: 测试相关
chore: 构建/工具相关
```

---

**版本**：v1.5.0  
**更新日期**：2025-01-29  
**维护者**：CogniFlow Team
