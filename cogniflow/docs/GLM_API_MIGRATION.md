# GLM API 迁移指南

## 迁移日期
2025年10月29日

## 迁移原因
- Miaoda API 端点不可用（404 错误）
- 切换到更稳定的 GLM (智谱AI) API
- GLM 提供更好的中文支持和响应速度

## 迁移内容

### 1. 环境变量变更

#### 移除
- ❌ `VITE_APP_ID` - Miaoda 应用ID（已废弃）

#### 新增
- ✅ `VITE_GLM_API_KEY` - GLM API 密钥（**必需**）
- ✅ `VITE_GLM_MODEL` - GLM 模型名称（可选，默认 `glm-4-flash`）

#### 配置示例
```env
# GLM API 配置
VITE_GLM_API_KEY=your_glm_api_key_here
VITE_GLM_MODEL=glm-4-flash
```

### 2. API 端点变更

#### 原 Miaoda API
```
POST /api/miaoda/runtime/apicenter/source/proxy/ernietextgenerationchat
Headers:
  X-App-Id: {VITE_APP_ID}
  Content-Type: application/json
Body:
  {
    "messages": [...],
    "enable_thinking": false
  }
```

#### 新 GLM API
```
POST https://open.bigmodel.cn/api/paas/v4/chat/completions
Headers:
  Authorization: Bearer {VITE_GLM_API_KEY}
  Content-Type: application/json
Body:
  {
    "model": "glm-4-flash",
    "messages": [...],
    "temperature": 0.95,
    "stream": true
  }
```

### 3. 代码变更

#### 文件 1: `/src/utils/ai.ts`

**变更内容：**
1. 更新 `ChatStreamOptions` 接口
   - 移除 `endpoint` 和 `apiId` 参数
   - 新增 `model` 和 `temperature` 可选参数

2. 更新 `sendChatStream` 函数
   - 使用 GLM API 端点
   - 使用 Bearer Token 认证
   - 添加 `model` 和 `temperature` 参数

3. 更新 `processTextWithAI` 函数
   - 移除 `VITE_APP_ID` 引用
   - 移除 `endpoint` 和 `apiId` 参数

**关键改动：**
```typescript
// 之前
export interface ChatStreamOptions {
  endpoint: string;
  apiId: string;
  // ...
}

// 之后
export interface ChatStreamOptions {
  model?: string;
  temperature?: number;
  // ...
}
```

#### 文件 2: `/src/utils/queryProcessor.ts`

**变更内容：**
1. 更新 `parseQueryIntent` 函数
   - 移除 `VITE_APP_ID` 引用
   - 移除 `endpoint` 和 `apiId` 参数

### 4. 支持的模型

GLM 提供多个模型选择：

| 模型名称 | 特点 | 适用场景 |
|---------|------|---------|
| `glm-4-flash` | 快速响应，性价比高 | **推荐**，默认使用 |
| `glm-4` | 标准版本，平衡性能 | 复杂任务 |
| `glm-4-plus` | 最强性能 | 高难度任务 |
| `glm-4-air` | 轻量版本 | 简单任务 |

### 5. 获取 GLM API Key

1. 访问 [智谱AI开放平台](https://open.bigmodel.cn/)
2. 注册/登录账号
3. 进入控制台
4. 创建 API Key
5. 复制 API Key 到 `.env` 文件

### 6. 兼容性说明

#### ✅ 完全兼容
- 所有现有功能保持不变
- AI 文本处理功能
- 查询意图解析功能
- 流式响应处理

#### ⚠️ 注意事项
- GLM API 需要稳定的网络连接
- API Key 有调用配额限制（根据套餐）
- 响应格式与 Miaoda 完全兼容

### 7. 错误处理

如果遇到错误，检查以下几点：

1. **API Key 未配置**
   ```
   错误：GLM API Key 未配置，请在 .env 文件中设置 VITE_GLM_API_KEY
   解决：在 .env 中添加 VITE_GLM_API_KEY
   ```

2. **认证失败**
   ```
   错误：401 Unauthorized
   解决：检查 API Key 是否正确
   ```

3. **配额超限**
   ```
   错误：429 Too Many Requests
   解决：升级 API 套餐或等待配额重置
   ```

4. **网络错误**
   ```
   错误：Network request failed
   解决：检查网络连接，确保能访问 open.bigmodel.cn
   ```

### 8. 性能对比

| 指标 | Miaoda API | GLM API |
|------|-----------|---------|
| **可用性** | ❌ 404 错误 | ✅ 稳定 |
| **响应速度** | N/A | ⚡ 快速 |
| **中文支持** | ✅ 好 | ✅ 优秀 |
| **流式响应** | ✅ 支持 | ✅ 支持 |
| **认证方式** | X-App-Id | Bearer Token |

### 9. 测试清单

迁移后需要测试以下功能：

- [ ] 快速输入文本处理
- [ ] AI 自动分类（task/event/note/data）
- [ ] 时间提取和解析
- [ ] 标签自动提取
- [ ] 查询意图解析
- [ ] 流式响应显示
- [ ] 错误处理和降级

### 10. 回滚方案

如需回滚到 Miaoda API：

1. 恢复 `.env` 中的 `VITE_APP_ID`
2. 恢复 `ai.ts` 和 `queryProcessor.ts` 的旧代码
3. 确保 Miaoda 端点可用

### 11. 未来优化建议

1. **多模型支持**
   - 允许用户选择不同的 GLM 模型
   - 根据任务复杂度自动选择模型

2. **缓存机制**
   - 缓存常见查询的结果
   - 减少 API 调用次数

3. **本地 fallback**
   - API 失败时使用本地规则处理
   - 提供基本的文本解析能力

4. **监控和统计**
   - 记录 API 调用次数
   - 监控响应时间和成功率

## 迁移完成确认

✅ 环境变量已更新
✅ `ai.ts` 已迁移
✅ `queryProcessor.ts` 已迁移
✅ 所有代码编译通过
⏳ 功能测试待进行

## 技术支持

如有问题，请参考：
- [GLM API 文档](https://open.bigmodel.cn/dev/api)
- [GLM 开发者社区](https://open.bigmodel.cn/dev/community)

---

**迁移状态：** ✅ 完成  
**测试状态：** ⏳ 待测试  
**生产就绪：** ⏳ 需要配置真实 API Key
