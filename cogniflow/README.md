# CogniFlow - 智能信息管理工具

> 让 AI 帮你整理碎片化信息

## 📖 简介

CogniFlow 是一款由 AI 驱动的智能信息管理工具，帮助您轻松管理日常工作和生活中的碎片化信息。

**核心理念**：你只管记录，我负责管理

## ✨ 主要特性

- 🤖 **AI 智能分类** - 自动识别任务、日程、笔记、资料
- ⚡ **流式输入** - 像聊天一样快速记录信息
- 📊 **智能仪表盘** - 四个视图高效管理信息
- 🏷️ **自动标签** - AI 自动提取关键词标签
- 🔗 **链接智能处理** - 自动获取网页标题和摘要
- 📅 **日历视图** - 可视化查看日程安排
- 🔍 **自然语言查询** - 用自然语言搜索信息
- 💾 **自动备份** - 定期自动备份，防止数据丢失
- 🌙 **深色模式** - 支持明暗主题切换

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env`，配置智谱 AI API：

```env
VITE_GLM_API_KEY=your_api_key_here
VITE_GLM_MODEL=glm-4-flash
```

**获取 API Key**：访问 [智谱AI开放平台](https://open.bigmodel.cn/)

### 3. 启动应用

```bash
npm run dev -- --host 127.0.0.1
```

应用将在 `http://127.0.0.1:5173` 启动。

## 📚 文档

- 📖 [用户手册](./USER_MANUAL.md) - 完整的功能使用指南
- 👨‍💻 [开发指南](./docs/DEVELOPER_GUIDE.md) - 开发者文档
- 🚀 [部署指南](./DEPLOYMENT_CHECKLIST.md) - 生产环境部署

## 🛠 技术栈

- **前端框架**：React 18 + TypeScript + Vite
- **UI 组件**：Tailwind CSS + shadcn/ui
- **数据存储**：IndexedDB（本地）
- **AI 服务**：智谱 AI (GLM-4)
- **状态管理**：React Hooks
- **路由**：React Router

## 📁 项目结构

```
cogniflow/
├── src/
│   ├── components/      # React 组件
│   ├── db/             # 数据库层
│   ├── services/       # 业务服务
│   ├── utils/          # 工具函数
│   ├── types/          # 类型定义
│   ├── pages/          # 页面组件
│   └── hooks/          # 自定义 Hooks
├── public/             # 静态资源
├── docs/               # 开发文档
├── .env.example        # 环境变量示例
└── package.json        # 项目配置
```

详细结构请查看 [开发指南](./docs/DEVELOPER_GUIDE.md)

## 📋 最新更新

### v1.5.0 (2025-01-29)
- 🎉 新增数据自动备份功能
- 💾 定期自动备份到本地
- 🔄 支持手动备份和恢复
- 📥 支持导出/导入备份文件
- ⚙️ 完整的备份管理界面

### v1.4.0
- ✅ 完全移除第三方依赖，使用本地存储
- ✅ 迁移到智谱 AI (GLM) API
- ✅ 优化 UI/UX，提高信息密度
- ✅ 实现卡片悬浮操作按钮
- ✅ 优化 URL 卡片布局

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

---

**版本**：v1.5.0  
**更新日期**：2025-01-29
