# 贡献指南

感谢您对 CSDN 自动化博客发布系统的兴趣！我们欢迎各种形式的贡献。

## 🤝 如何贡献

### 报告问题 (Issues)

如果您发现了bug或有功能建议：

1. 首先搜索[现有的issues](https://github.com/yourusername/csdn-blog-auto-publish/issues)，确保问题没有被重复报告
2. 使用相应的issue模板创建新issue
3. 提供详细的描述和复现步骤
4. 如果是bug，请包含错误日志和环境信息

### 功能请求

1. 在创建功能请求之前，请先讨论该功能的必要性
2. 使用功能请求模板描述您的想法
3. 解释该功能的用例和预期行为

### 代码贡献

#### 开发环境设置

```bash
# 1. Fork 仓库并克隆
git clone https://github.com/yourusername/csdn-blog-auto-publish.git
cd csdn-blog-auto-publish

# 2. 创建虚拟环境
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# 3. 安装依赖（包括开发依赖）
pip install -r requirements.txt
pip install -r requirements-dev.txt  # 如果存在

# 4. 安装Playwright
playwright install chromium

# 5. 设置环境变量
export ZHIPUAI_API_KEY="your_test_api_key"
```

#### 代码规范

我们使用以下工具确保代码质量：

```bash
# 代码格式化
black .
isort .

# 代码检查
flake8 .
pylint *.py

# 类型检查
mypy .
```

#### 提交流程

1. **创建分支**
   ```bash
   git checkout -b feature/your-feature-name
   # 或
   git checkout -b fix/issue-number
   ```

2. **开发和测试**
   - 编写代码
   - 添加或更新测试
   - 确保所有测试通过
   - 更新文档（如需要）

3. **运行测试**
   ```bash
   # 运行所有测试
   python -m pytest tests/
   
   # 运行特定测试
   python -m pytest tests/test_specific.py
   
   # 运行代码覆盖率测试
   python -m pytest --cov=. tests/
   ```

4. **提交代码**
   ```bash
   git add .
   git commit -m "feat: add new feature description"
   ```

5. **推送并创建PR**
   ```bash
   git push origin feature/your-feature-name
   ```
   然后在GitHub上创建Pull Request

### 提交信息规范

我们使用[约定式提交](https://www.conventionalcommits.org/zh-hans/)格式：

```
<类型>[可选的作用域]: <描述>

[可选的正文]

[可选的脚注]
```

#### 类型
- `feat`: 新功能
- `fix`: 修复问题
- `docs`: 文档更新
- `style`: 代码格式（不影响功能）
- `refactor`: 重构代码
- `test`: 添加或修改测试
- `chore`: 构建过程或辅助工具的变动

#### 示例
```
feat: add daily auto generation feature

- Integrate Zhipu Web Search API
- Support 15 technical domains monitoring
- Add news-based article generation

Closes #123
```

## 📋 开发指南

### 项目结构

```
csdn-blog-auto-publish/
├── 🚀 核心模块
│   ├── ui.py                       # Web界面
│   ├── auto_generate_daily.py      # 每日生成
│   ├── publish_csdn.py             # 发布功能
│   └── zhipu_*.py                  # AI相关模块
├── 🧪 测试
│   └── tests/                      # 所有测试文件
├── 📚 文档
│   └── docs/                       # 文档文件
└── 📊 数据
    ├── posts/                      # 文章存储
    └── todo/                       # 临时数据
```

### 添加新功能

1. **规划**: 在issue中讨论功能设计
2. **开发**: 创建新的模块文件
3. **测试**: 编写单元测试和集成测试
4. **文档**: 更新README和相关文档
5. **集成**: 确保与现有功能兼容

### 测试指南

#### 编写测试

```python
# tests/test_new_feature.py
import pytest
from your_module import YourClass

class TestYourClass:
    def test_basic_functionality(self):
        # 测试基础功能
        instance = YourClass()
        result = instance.method()
        assert result == expected_value
    
    def test_error_handling(self):
        # 测试错误处理
        with pytest.raises(ValueError):
            YourClass().invalid_method()
```

#### 测试类型

- **单元测试**: 测试单个函数或类
- **集成测试**: 测试模块间的交互
- **功能测试**: 测试完整的用户场景
- **性能测试**: 测试关键功能的性能

### 代码审查

所有代码更改都需要通过代码审查：

1. 确保代码符合项目规范
2. 检查测试覆盖率
3. 验证功能正确性
4. 评估性能影响
5. 检查安全性

## 🎯 优先级任务

我们特别欢迎以下类型的贡献：

### 高优先级
- 🐛 Bug修复
- 📚 文档改进
- 🧪 测试覆盖率提升
- 🔒 安全性增强

### 中优先级
- ✨ 新平台支持（掘金、博客园等）
- 🎨 UI/UX改进
- ⚡ 性能优化
- 🌍 国际化支持

### 长期目标
- 🤖 AI功能增强
- 📊 数据分析和报表
- 🔄 工作流自动化
- 🏗️ 架构优化

## 📝 文档贡献

### 文档类型
- **API文档**: 函数和类的使用说明
- **用户指南**: 功能使用教程
- **开发文档**: 架构和设计说明
- **示例代码**: 使用示例和最佳实践

### 文档规范
- 使用Markdown格式
- 包含代码示例
- 提供清晰的截图（如需要）
- 保持内容更新

## ❓ 获得帮助

如果您在贡献过程中遇到问题：

1. 查看[FAQ](README.md#-常见问题)
2. 搜索现有的issues和讨论
3. 在[GitHub Discussions](https://github.com/yourusername/csdn-blog-auto-publish/discussions)中提问
4. 联系项目维护者

## 🏆 贡献者认可

我们重视每一个贡献者的努力：

- 贡献者名单会在README中展示
- 重大贡献会在发布说明中特别提及
- 活跃贡献者可能被邀请成为项目维护者

## 📜 行为准则

请参阅我们的[行为准则](CODE_OF_CONDUCT.md)，确保友善和包容的社区环境。

---

再次感谢您的贡献！您的参与让这个项目变得更好。🎉