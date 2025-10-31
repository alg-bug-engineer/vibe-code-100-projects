# GLM API 快速配置指南

## 🚀 快速开始

### 1. 获取 GLM API Key

1. 访问 [智谱AI开放平台](https://open.bigmodel.cn/)
2. 注册/登录账号（支持手机号、微信等）
3. 进入 **控制台**
4. 点击 **API 密钥管理**
5. 创建新的 API Key
6. 复制生成的 API Key

### 2. 配置环境变量

打开项目根目录的 `.env` 文件，添加：

```env
VITE_GLM_API_KEY=your_api_key_here
VITE_GLM_MODEL=glm-4-flash
```

**重要提示：**
- ⚠️ 请将 `your_api_key_here` 替换为你的真实 API Key
- ⚠️ 不要将 `.env` 文件提交到 Git 仓库
- ✅ 可以参考 `.env.example` 文件进行配置

### 3. 安装依赖（如果还没安装）

```bash
npm install
# 或
pnpm install
# 或
yarn install
```

### 4. 启动项目

```bash
npm run dev
# 或
pnpm run dev
# 或
yarn dev
```

### 5. 测试 AI 功能

启动成功后，访问 `http://localhost:5173`（或显示的端口），然后：

1. **测试文本处理**
   - 在输入框输入："明天下午3点开会讨论Q1方案"
   - 系统应自动识别为"日程"类型，并提取时间

2. **测试查询功能**
   - 输入："?今天的任务"
   - 系统应解析查询意图并返回今天的任务列表

3. **测试其他类型**
   - 任务："完成项目文档"
   - 笔记："今天学到了一个新技巧"
   - 资料："https://example.com"（会识别为链接）

## 🎯 模型选择

根据你的需求选择合适的模型：

| 使用场景 | 推荐模型 | 配置 |
|---------|---------|------|
| **日常使用（推荐）** | GLM-4-Flash | `VITE_GLM_MODEL=glm-4-flash` |
| 复杂任务处理 | GLM-4 | `VITE_GLM_MODEL=glm-4` |
| 高难度分析 | GLM-4-Plus | `VITE_GLM_MODEL=glm-4-plus` |
| 简单快速响应 | GLM-4-Air | `VITE_GLM_MODEL=glm-4-air` |

## 🐛 常见问题

### Q1: 提示 "GLM API Key 未配置"

**解决方案：**
1. 确认 `.env` 文件中已添加 `VITE_GLM_API_KEY`
2. 确认环境变量名称正确（注意大小写）
3. 重启开发服务器（修改 `.env` 后需要重启）

### Q2: 401 Unauthorized 错误

**解决方案：**
1. 检查 API Key 是否正确
2. 检查 API Key 是否已激活
3. 登录智谱AI控制台查看 API Key 状态

### Q3: 429 Too Many Requests 错误

**原因：** API 调用频率超限

**解决方案：**
1. 等待一段时间后重试
2. 升级 API 套餐获取更高配额
3. 优化代码减少不必要的 API 调用

### Q4: 网络连接失败

**解决方案：**
1. 检查网络连接
2. 确认能访问 `https://open.bigmodel.cn`
3. 如果在内网环境，检查代理设置

### Q5: 响应速度慢

**解决方案：**
1. 切换到更快的模型（如 `glm-4-flash`）
2. 检查网络延迟
3. 减少 system prompt 的长度

## 💡 API 配额说明

### 免费版
- ✅ 每月一定量的免费调用
- ⚠️ 有速率限制
- 适合开发测试

### 付费版
- ✅ 更高的调用配额
- ✅ 更快的响应速度
- ✅ 更稳定的服务
- 适合生产环境

查看详细定价：[https://open.bigmodel.cn/pricing](https://open.bigmodel.cn/pricing)

## 🔒 安全提示

1. **不要公开 API Key**
   - 不要提交到公共代码仓库
   - 不要在前端代码中硬编码
   - 定期更换 API Key

2. **使用环境变量**
   - 始终使用 `.env` 文件
   - 将 `.env` 添加到 `.gitignore`
   - 使用 `.env.example` 作为模板

3. **监控使用情况**
   - 定期检查 API 调用量
   - 设置用量告警
   - 及时发现异常调用

## 📚 更多资源

- [GLM API 官方文档](https://open.bigmodel.cn/dev/api)
- [GLM 模型介绍](https://open.bigmodel.cn/dev/howuse/model)
- [开发者社区](https://open.bigmodel.cn/dev/community)
- [常见问题 FAQ](https://open.bigmodel.cn/dev/faq)

## 🎉 完成！

配置完成后，你的 CogniFlow 应用就可以使用 GLM 强大的 AI 能力了！

有问题随时查看 `GLM_API_MIGRATION.md` 获取详细的迁移文档。
