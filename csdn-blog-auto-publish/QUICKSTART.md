# 快速开始指南

## 10分钟快速上手

### 第一步：安装依赖（2分钟）

```bash
# 进入项目目录
cd csdn-blog-auto-publish

# 安装Python依赖
pip install -r requirements.txt

# 安装Playwright浏览器
python -m playwright install
```

### 第二步：配置API Key（1分钟）

```bash
# 1. 获取智谱AI API Key
# 访问：https://open.bigmodel.cn/usercenter/apikeys

# 2. 设置环境变量
export ZHIPUAI_API_KEY="your-api-key-here"

# 3. 验证配置
python -c "import os; print('API Key:', os.getenv('ZHIPUAI_API_KEY')[:10] + '...')"
```

### 第三步：生成第一篇文章（3分钟）

```bash
# 方法1：使用默认配置（最简单）
python auto_generate.py

# 方法2：指定关键词
python auto_generate.py --keyword "Python编程"

# 方法3：批量生成
python auto_generate.py --generate-articles 5
```

这将：
- 生成10个标题（保存到 todo/ 目录）
- 生成1篇示例文章（保存到 posts/ 目录）

### 第四步：发布到CSDN（4分钟）

```bash
# 首次运行（需要登录）
python publish_csdn.py --headless false

# 在打开的浏览器中：
# 1. 扫码登录CSDN
# 2. 等待脚本自动填充内容
# 3. 脚本会自动点击发布

# 后续运行（自动登录）
python publish_csdn.py
```

## 常用命令速查

### 内容生成

```bash
# 生成标题（不生成文章）
python auto_generate.py --titles-only --count 20

# 生成3篇文章
python auto_generate.py --generate-articles 3

# 使用指定关键词生成5篇文章
python auto_generate.py --keyword "机器学习" --generate-articles 5
```

### 发布管理

```bash
# 查看待发布文章
ls -l posts/

# 发布所有文章
python publish_csdn.py

# 调试模式（不触发发布）
python publish_csdn.py --skip-publish
```

### 维护清理

```bash
# 查看文章数量
ls posts/*.md | wc -l

# 备份已发布文章
mkdir -p archive/$(date +%Y%m%d)
mv posts/*.md archive/$(date +%Y%m%d)/

# 清理posts目录
rm posts/*.md
```

## 推荐工作流

### 每日发布流程

```bash
# 早上：生成当天的内容
python auto_generate.py --keyword "今日关键词" --generate-articles 10

# 检查生成的文章
ls -l posts/

# 下午：批量发布
python publish_csdn.py

# 发布完成后备份
mkdir -p archive/$(date +%Y%m%d)
mv posts/*.md archive/$(date +%Y%m%d)/
```

### 批量准备流程

```bash
# 第1天：生成大量标题
python auto_generate.py --titles-only --count 50

# 第2-7天：每天生成部分文章
python auto_generate.py --generate-articles 10

# 定期发布
python publish_csdn.py
```

## 故障排除

### 问题1：API调用失败

```bash
# 检查API Key
echo $ZHIPUAI_API_KEY

# 测试连接
python demo.py 2
```

### 问题2：发布失败

```bash
# 删除旧的登录状态
rm storage.json

# 重新登录
python publish_csdn.py --headless false --login-timeout 180
```

### 问题3：posts目录已满

```bash
# 查看当前状态
ls -l posts/ | wc -l

# 方法1：发布后自动清理
python publish_csdn.py

# 方法2：手动备份
mkdir -p backup
mv posts/*.md backup/
```

## 高级技巧

### 1. 批量关键词处理

编辑 `keywords.txt`：
```
人工智能
机器学习
深度学习
自然语言处理
计算机视觉
```

然后运行脚本读取第一个关键词：
```bash
python auto_generate.py --generate-articles 5
```

### 2. 自定义文章模板

编辑 `zhipu_content_generator.py`，修改 `generate_article()` 中的prompt。

### 3. 定时任务

使用cron（Linux/Mac）：
```bash
# 编辑crontab
crontab -e

# 每天早上9点生成内容
0 9 * * * cd /path/to/csdn-blog-auto-publish && /path/to/python auto_generate.py --generate-articles 5

# 每天下午3点发布
0 15 * * * cd /path/to/csdn-blog-auto-publish && /path/to/python publish_csdn.py
```

### 4. 使用配置文件

```bash
# 创建配置文件
cp .env.example .env

# 编辑配置
nano .env

# 加载配置（在脚本中添加）
from dotenv import load_dotenv
load_dotenv()
```

## 下一步

- 查看完整文档：`README_NEW.md`
- 运行演示脚本：`python demo.py`
- 自定义配置：编辑各个Python文件

## 获取帮助

```bash
# 查看命令帮助
python auto_generate.py --help
python publish_csdn.py --help

# 运行演示
python demo.py 1
```

祝你使用愉快！🎉
