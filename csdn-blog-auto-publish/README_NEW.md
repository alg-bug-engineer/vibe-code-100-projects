# CSDN Markdown 自动发布工具（Playwright + 智谱AI）

一个完整的自动化技术博客发布系统，集成智谱AI自动生成内容，并批量发布到CSDN编辑器。

## 新功能 ✨

### 🆕 每日自动化内容生成（v2.1.0）
- **智能新闻搜索**：基于智谱Web Search API，自动搜索前一天的技术新闻
- **自动提炼信息**：从大模型、AI、智能体等15个领域提取关键动态
- **智能文章生成**：基于真实新闻背景生成15篇高质量技术博客
- **完全自动化**：无需手动输入关键词，实现一键生成

### 自动内容生成（v2.0.0）
- **智能标题生成**：基于关键词或最新技术趋势，自动生成10个吸引人的博客标题
- **文章自动写作**：根据标题调用智谱AI，生成高质量的Markdown格式技术文章
- **智能队列管理**：自动管理待发布文章（posts目录最多16篇），多余标题存入todo目录

### 核心特性
- **批量处理**：自动处理 `posts/` 目录中的所有Markdown文件
- **登录持久化**：`storage.json` 保存登录状态，避免重复扫码
- **智能发布**：自动填充标题、正文、标签，一键发布
- **健壮性强**：多重选择器回退，适配CSDN页面变化

## 目录结构

```
csdn-blog-auto-publish/
├── auto_generate.py              # 自动生成内容主脚本（新增）
├── zhipu_content_generator.py    # 智谱AI内容生成器（新增）
├── publish_csdn.py               # CSDN发布脚本
├── keywords.txt                  # 关键词配置文件
├── requirements.txt              # Python依赖
├── storage.json                  # 登录状态（首次登录后生成）
├── posts/                        # 待发布文章目录（最多16篇）
└── todo/                         # 标题存储目录
    └── YYYYMMDD_titles.txt       # 每日生成的标题列表
```

## 环境准备

### 1. 安装依赖

```bash
# 创建虚拟环境（推荐）
python3 -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# 安装依赖
pip install -r requirements.txt

# 安装Playwright浏览器
python -m playwright install
```

### 2. 配置智谱AI

获取智谱AI API Key：https://open.bigmodel.cn/

设置环境变量：
```bash
# Linux/Mac
export ZHIPUAI_API_KEY="your-api-key-here"

# Windows PowerShell
$env:ZHIPUAI_API_KEY="your-api-key-here"

# 或者写入 ~/.bashrc 或 ~/.zshrc 永久保存
echo 'export ZHIPUAI_API_KEY="your-api-key-here"' >> ~/.zshrc
source ~/.zshrc
```

### 3. 配置关键词（可选）

编辑 `keywords.txt` 文件，每行一个关键词：
```
人工智能
vllm
大模型训练
云原生
```

## 使用方法

### 🆕 方式一：每日自动生成（推荐 - v2.1.0）

#### 完全自动化的每日博客生成

```bash
# 一键生成：搜索昨天的新闻，生成15篇文章
python auto_generate_daily.py

# 使用一键启动脚本
./start.sh  # 选择选项 5
```

**自动完成**：
1. 搜索昨天的大模型、AI、智能体等领域新闻
2. 提取15条关键技术动态
3. 生成15个优化的博客标题
4. 基于新闻背景生成高质量文章
5. 保存到 posts/ 目录

#### 分步执行

```bash
# 步骤1：搜索新闻和生成标题
python auto_generate_daily.py --search-only

# 步骤2：从已有标题生成文章（可分批）
python auto_generate_daily.py --from-existing --articles 5
```

#### 自定义选项

```bash
# 搜索最近3天的新闻
python auto_generate_daily.py --days 3

# 指定搜索主题
python auto_generate_daily.py --topics "大模型" "AGI" "多模态AI"

# 生成10篇文章
python auto_generate_daily.py --count 10 --articles 10
```

**详细文档**：查看 [DAILY_AUTO_GENERATE.md](DAILY_AUTO_GENERATE.md)

---

### 方式二：基于关键词生成（v2.0.0）

#### 步骤1：生成内容

```bash
# 1. 生成10个标题（保存到todo目录）和1篇示例文章（保存到posts目录）
python auto_generate.py

# 2. 使用指定关键词生成
python auto_generate.py --keyword "人工智能"

# 3. 生成指定数量的文章（会检查posts目录限制）
python auto_generate.py --generate-articles 5

# 4. 只生成标题，不生成文章
python auto_generate.py --titles-only --count 15

# 5. 从todo目录的标题生成3篇文章
python auto_generate.py --generate-articles 3
```

**命令参数说明：**
- `--keyword`：指定关键词（不指定则从keywords.txt读取或使用最新趋势）
- `--count`：生成标题数量（默认10个）
- `--titles-only`：只生成标题，不生成文章
- `--generate-articles N`：生成N篇文章（自动检查posts限制）
- `--posts-limit`：posts目录文章数量限制（默认16篇）

#### 步骤2：发布到CSDN

```bash
# 首次运行需要登录（默认非无头模式）
python publish_csdn.py --headless false

# 后续运行会自动使用保存的登录状态
python publish_csdn.py
```

### 方式二：手动创建文章后发布

1. 将Markdown文件放入 `posts/` 目录
2. 运行发布脚本：
```bash
python publish_csdn.py
```

### 方式三：高级用法

```bash
# 生成5个标题并立即生成3篇文章
python auto_generate.py --count 5 --generate-articles 3

# 修改posts目录限制为20篇
python auto_generate.py --generate-articles 5 --posts-limit 20

# 指定自定义关键词文件
python auto_generate.py --keywords-file my_keywords.txt

# 发布时跳过自动点击发布按钮（调试用）
python publish_csdn.py --skip-publish

# 设置登录超时时间为3分钟
python publish_csdn.py --login-timeout 180
```

## 工作流程

### 完整自动化流程

```
1. 读取关键词 (keywords.txt)
   ↓
2. 调用智谱AI生成10个标题
   ↓
3. 保存标题到 todo/YYYYMMDD_titles.txt
   ↓
4. 选择标题生成文章（Markdown格式）
   ↓
5. 保存文章到 posts/ 目录（最多16篇）
   ↓
6. 运行发布脚本
   ↓
7. 自动登录CSDN（首次需要扫码，后续自动）
   ↓
8. 批量发布文章（每篇间隔30秒）
   ↓
9. 完成
```

## Markdown文章格式

### 方式1：使用YAML Front Matter（推荐）

```markdown
---
title: 文章标题
tags: [人工智能, 深度学习]
---

## 引言

这里是文章内容...

## 主要内容

...
```

### 方式2：纯Markdown

```markdown
# 文章标题

## 引言

这里是文章内容...
```

## 常见问题

### 1. 智谱AI相关

**Q: API调用失败怎么办？**
```bash
# 检查API Key是否设置
echo $ZHIPUAI_API_KEY

# 测试API连接
python -c "from zhipuai import ZhipuAI; client = ZhipuAI(); print('API连接成功')"
```

**Q: 如何查看API调用额度？**
访问：https://open.bigmodel.cn/usercenter/apikeys

**Q: 生成的文章质量不满意？**
- 修改 `zhipu_content_generator.py` 中的prompt提示词
- 调整 `temperature` 参数（0.5-0.9之间）
- 使用更具体的关键词

### 2. 发布相关

**Q: posts目录已满怎么办？**
```bash
# 查看当前文章数
ls -l posts/*.md | wc -l

# 方法1：发布后会自动清理
python publish_csdn.py

# 方法2：手动移动到备份目录
mkdir -p backup
mv posts/*.md backup/

# 方法3：修改限制（不推荐超过20篇）
python auto_generate.py --posts-limit 20
```

**Q: 每次都要登录？**
- 确认 `storage.json` 文件存在
- 如果损坏，删除后重新登录：`rm storage.json`

**Q: 发布按钮点不到？**
- CSDN页面结构可能变化，脚本会尝试多种选择器
- 可以使用 `--skip-publish` 调试，手动完成最后步骤

**Q: 中文输入异常？**
- 脚本优先使用编辑器API，失败时会回退到剪贴板
- 确保浏览器有剪贴板权限

### 3. 内容生成相关

**Q: 如何批量生成多篇文章？**
```bash
# 一次生成5篇
python auto_generate.py --generate-articles 5

# 如果posts已有文章，会自动检查剩余空间
```

**Q: 如何使用todo目录的标题？**
```bash
# 标题会自动保存到 todo/YYYYMMDD_titles.txt
# 下次生成文章时会优先使用今天的标题
python auto_generate.py --generate-articles 3
```

**Q: 如何自定义生成的内容？**
编辑 `zhipu_content_generator.py`，修改：
- `generate_titles()` - 标题生成prompt
- `generate_article()` - 文章生成prompt

## 高级配置

### 自定义模型参数

编辑 `zhipu_content_generator.py`：

```python
# 标题生成 - 使用快速模型
model="glm-4-flash"      # 可选: glm-4, glm-4-plus
temperature=0.8          # 0.0-1.0, 越高越有创意

# 文章生成 - 使用强大模型
model="glm-4-plus"       # 可选: glm-4, glm-4-flash
temperature=0.7          # 0.0-1.0, 平衡质量和创意
max_tokens=8000          # 最大输出长度
```

### 修改每日发布限制

```python
# 在 auto_generate.py 中修改默认值
parser.add_argument(
    "--posts-limit",
    type=int,
    default=16,  # 改为你想要的数量
    help="posts目录文章数量限制"
)
```

### 自定义文章模板

编辑 `zhipu_content_generator.py` 的 `generate_article()` 方法中的prompt。

## 安全提示

⚠️ **重要**：
- 不要将 `storage.json`（包含登录信息）提交到公共仓库
- 不要泄露智谱AI的API Key
- 建议将敏感文件加入 `.gitignore`

```bash
# .gitignore 示例
storage.json
.env
*.pyc
__pycache__/
.venv/
```

## 性能优化

### 减少API调用成本

```bash
# 1. 先生成标题（便宜）
python auto_generate.py --titles-only --count 20

# 2. 需要时再生成文章（较贵）
python auto_generate.py --generate-articles 3

# 3. 使用更便宜的模型
# 编辑 zhipu_content_generator.py
# 将 glm-4-plus 改为 glm-4-flash
```

### 批量发布优化

```bash
# 发布时的等待时间（避免被CSDN限流）
# 在 publish_csdn.py 中，每篇文章发布后等待30秒
time.sleep(30)  # 可根据需要调整
```

## 贡献指南

欢迎提交Issue和Pull Request！

改进方向：
- [ ] 支持更多博客平台（掘金、博客园等）
- [ ] 添加文章质量评估
- [ ] 支持封面图自动生成
- [ ] 添加发布统计和报告
- [ ] 支持定时发布

## 许可证

MIT License

## 更新日志

### v2.0.0 (2025-10-28)
- ✨ 新增智谱AI自动内容生成功能
- ✨ 新增标题批量生成（基于关键词或最新趋势）
- ✨ 新增文章自动写作功能
- ✨ 新增posts目录容量管理（最多16篇）
- ✨ 新增todo目录标题存储
- 🔧 优化命令行参数和使用体验

### v1.0.0
- 基础CSDN自动发布功能
- 登录状态持久化
- 批量文章处理

## 联系方式

如有问题，请提交Issue或联系项目维护者。
