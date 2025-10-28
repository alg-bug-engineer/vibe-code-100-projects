# 每日自动化内容生成功能 - 使用指南

## 🌟 新功能概述

基于智谱AI的Web Search API，实现完全自动化的每日技术博客生成：

1. **自动搜索新闻** - 搜索前一天的大模型、AI、智能体等领域新闻
2. **智能提炼信息** - 从新闻中提取15条关键技术动态
3. **自动生成文章** - 基于新闻背景生成高质量技术博客

## 🎯 核心优势

### 之前的方式
- ❌ 需要手动填写关键词
- ❌ 手动更新 keywords.txt
- ❌ 标题和内容可能脱节
- ❌ 无法保证时效性

### 现在的方式
- ✅ **完全自动化** - 无需任何手动输入
- ✅ **实时新闻** - 基于前一天的最新技术动态
- ✅ **内容关联** - 文章内容与新闻背景紧密结合
- ✅ **时效性强** - 保证内容的时效性和相关性

## 📋 技术领域

默认搜索以下技术领域的新闻：

1. 大模型
2. 人工智能
3. 智能体
4. AI技术
5. 强化学习
6. 文生视频
7. 机器学习
8. 深度学习
9. 自然语言处理
10. 计算机视觉
11. 生成式AI
12. GPT
13. Transformer
14. 多模态AI
15. AI应用

## 🚀 快速开始

### 方式1：一键启动（推荐）

```bash
./start.sh
# 选择选项 5: 每日自动生成
```

### 方式2：命令行使用

```bash
# 默认：搜索昨天的新闻，生成15篇文章
python auto_generate_daily.py

# 只搜索新闻和生成标题，不生成文章
python auto_generate_daily.py --search-only

# 从已有标题生成文章
python auto_generate_daily.py --from-existing --articles 15
```

## 📖 详细使用方法

### 1. 完整流程（默认）

```bash
python auto_generate_daily.py
```

**执行流程**：
1. 搜索昨天的技术新闻（5个领域，每个3条）
2. 提取15条关键信息
3. 生成15个优化后的文章标题
4. 基于新闻背景生成15篇文章
5. 保存到 posts/ 目录

### 2. 分步执行

#### 步骤1：只搜索和生成标题

```bash
python auto_generate_daily.py --search-only
```

**输出文件**：
- `todo/YYYYMMDD_news.json` - 原始新闻数据
- `todo/YYYYMMDD_titles_info.json` - 标题和摘要信息
- `todo/YYYYMMDD_titles.txt` - 标题列表

#### 步骤2：从已有标题生成文章

```bash
# 生成所有标题的文章
python auto_generate_daily.py --from-existing

# 只生成前5篇
python auto_generate_daily.py --from-existing --articles 5
```

### 3. 自定义搜索

#### 搜索最近3天的新闻

```bash
python auto_generate_daily.py --days 3
```

#### 自定义搜索主题

```bash
python auto_generate_daily.py --topics "大模型" "AGI" "多模态AI" "自动驾驶"
```

#### 生成指定数量

```bash
# 生成10篇文章
python auto_generate_daily.py --count 10 --articles 10
```

## 🔧 命令行参数

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `--search-only` | 只搜索和生成标题，不生成文章 | False |
| `--from-existing` | 从已有标题生成文章 | False |
| `--days N` | 搜索最近N天的新闻 | 1 |
| `--count N` | 生成N个标题 | 15 |
| `--articles N` | 生成N篇文章 | 所有标题 |
| `--topics A B C` | 自定义搜索主题 | 默认主题 |
| `--posts-limit N` | posts目录限制 | 16 |

## 📁 文件结构

### 生成的文件

```
todo/
├── 20251028_news.json          # 原始新闻数据
├── 20251028_titles_info.json   # 标题和摘要（包含上下文）
└── 20251028_titles.txt         # 纯标题列表

posts/
├── 标题1.md
├── 标题2.md
└── ...
```

### JSON 文件格式

**news.json**:
```json
[
  {
    "topic": "大模型",
    "title": "GPT-5即将发布...",
    "summary": "OpenAI宣布...",
    "source": "Web Search",
    "date": "2025-10-27"
  }
]
```

**titles_info.json**:
```json
[
  {
    "title": "GPT-5技术突破：多模态能力全面升级",
    "summary": "OpenAI宣布...",
    "topic": "大模型",
    "original_title": "GPT-5即将发布..."
  }
]
```

## 🎨 工作流程图

```
启动程序
    ↓
搜索昨天的技术新闻
    ├─ 大模型领域 (3条)
    ├─ 人工智能领域 (3条)
    ├─ 智能体领域 (3条)
    ├─ 强化学习领域 (3条)
    └─ 文生视频领域 (3条)
    ↓
AI提取关键信息
    ↓
保存新闻数据 (todo/YYYYMMDD_news.json)
    ↓
生成优化的文章标题 (15个)
    ↓
保存标题信息 (todo/YYYYMMDD_titles_info.json)
    ↓
基于新闻背景生成文章
    ├─ 结合新闻摘要
    ├─ 突出技术亮点
    └─ 深度分析应用
    ↓
保存到 posts/ 目录
    ↓
运行 publish_csdn.py 发布
```

## 💡 使用场景

### 场景1：每日定时生成

```bash
# 在 crontab 中添加
0 8 * * * cd /path/to/csdn-blog-auto-publish && python auto_generate_daily.py --articles 10
```

每天早上8点自动生成10篇文章。

### 场景2：批量准备内容

```bash
# 周一：搜索周末的新闻
python auto_generate_daily.py --days 2 --search-only

# 周二-周五：每天生成3篇文章
python auto_generate_daily.py --from-existing --articles 3
```

### 场景3：特定领域深度创作

```bash
# 只关注大模型和AI应用
python auto_generate_daily.py \
    --topics "大模型" "GPT" "LLM" "AI应用" \
    --count 20 \
    --articles 15
```

## 🔍 质量保证

### 1. 新闻真实性
- ✅ 使用智谱Web Search API获取真实新闻
- ✅ 包含来源和日期信息
- ✅ AI提取关键技术点

### 2. 标题优化
- ✅ 专业且吸引人
- ✅ 长度适中（15-35字）
- ✅ 突出技术亮点

### 3. 文章质量
- ✅ 结合新闻背景
- ✅ 深度技术分析
- ✅ 实际应用案例
- ✅ 2000-3000字
- ✅ 完整的Markdown格式

## 📊 与旧版本对比

| 特性 | 旧版本 (auto_generate.py) | 新版本 (auto_generate_daily.py) |
|------|---------------------------|--------------------------------|
| 关键词来源 | 手动输入或keywords.txt | 自动搜索新闻 |
| 内容时效性 | 依赖手动更新 | 实时新闻（昨天） |
| 标题质量 | AI生成 | 基于真实新闻优化 |
| 文章内容 | 通用模板 | 结合新闻背景 |
| 自动化程度 | 半自动 | 全自动 |
| 适用场景 | 特定主题深耕 | 每日动态追踪 |

## ⚠️ 注意事项

### 1. API调用量
- 搜索阶段：5个主题 × 2次调用 = 10次
- 标题优化：15个标题 × 1次 = 15次
- 文章生成：15篇 × 1次 = 15次
- **总计约40次API调用**

### 2. 成本优化建议

```bash
# 方案1：减少文章数量
python auto_generate_daily.py --count 10 --articles 10

# 方案2：分批生成
python auto_generate_daily.py --search-only  # 先搜索
python auto_generate_daily.py --from-existing --articles 5  # 分批生成

# 方案3：减少搜索主题
python auto_generate_daily.py --topics "大模型" "AI" --count 10
```

### 3. posts目录管理

```bash
# 检查当前文章数
ls posts/*.md | wc -l

# 清理已发布的文章
mkdir -p archive/$(date +%Y%m%d)
mv posts/*.md archive/$(date +%Y%m%d)/
```

## 🐛 故障排除

### Q1: API调用失败
```bash
# 检查API Key
echo $ZHIPUAI_API_KEY

# 测试连接
python -c "from zhipu_news_search import ZhipuNewsSearcher; s = ZhipuNewsSearcher(); print('连接成功')"
```

### Q2: 搜索结果为空
- 检查网络连接
- 尝试增加搜索天数：`--days 3`
- 更换搜索主题

### Q3: JSON解析失败
- 查看 `todo/YYYYMMDD_news.json` 文件
- 手动编辑修复格式
- 使用 `--from-existing` 继续生成

## 🎓 最佳实践

### 1. 每日工作流

```bash
# 早上：搜索和生成标题
python auto_generate_daily.py --search-only

# 检查标题质量
cat todo/$(date +%Y%m%d)_titles.txt

# 生成文章（分批）
python auto_generate_daily.py --from-existing --articles 5

# 下午：发布
python publish_csdn.py
```

### 2. 质量控制

- 生成后检查文章质量
- 必要时手动编辑修改
- 保存优质模板供参考

### 3. 数据管理

```bash
# 备份todo目录
cp -r todo todo_backup_$(date +%Y%m%d)

# 归档旧文章
mkdir -p archive
mv posts/*.md archive/
```

## 🚀 快速命令参考

```bash
# 最常用命令
python auto_generate_daily.py                    # 完整流程
python auto_generate_daily.py --search-only     # 只搜索
python auto_generate_daily.py --from-existing   # 从已有标题生成

# 自定义选项
python auto_generate_daily.py --days 3 --count 20          # 搜索3天，生成20个标题
python auto_generate_daily.py --articles 10                # 只生成10篇
python auto_generate_daily.py --topics "大模型" "AGI"      # 自定义主题

# 组合使用
python auto_generate_daily.py --days 2 --search-only      # 搜索2天的新闻
python auto_generate_daily.py --from-existing --articles 5 # 生成5篇文章
```

## 📞 获取帮助

```bash
python auto_generate_daily.py --help
python zhipu_news_search.py --help
```

---

**功能版本**: v2.1.0  
**更新时间**: 2025-10-28  
**维护者**: CSDN自动发布系统开发团队
