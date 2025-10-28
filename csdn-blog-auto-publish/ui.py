#!/usr/bin/env python3
"""
CSDN自动发布系统 - 可视化界面
基于 Gradio 实现的 Web UI
"""

import gradio as gr
import os
import json
import subprocess
import threading
from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Tuple, Optional

# 导入核心模块
from zhipu_news_search import ZhipuNewsSearcher
from zhipu_content_generator import ZhipuContentGenerator
import subprocess

# 配置
POSTS_DIR = Path("posts")
TODO_DIR = Path("todo")
POSTS_LIMIT = 16

# 全局状态
class AppState:
    def __init__(self):
        self.news_searcher = None
        self.content_generator = None
        self.api_key = os.getenv("ZHIPUAI_API_KEY", "")
        self.search_results = None
        self.titles_info = None
        
    def init_components(self, api_key: str = None):
        """初始化组件"""
        if api_key:
            self.api_key = api_key
            os.environ["ZHIPUAI_API_KEY"] = api_key
        
        if not self.api_key:
            raise ValueError("请先设置 API Key")
        
        self.news_searcher = ZhipuNewsSearcher(self.api_key)
        self.content_generator = ZhipuContentGenerator(self.api_key)
        
        return "✅ 组件初始化成功"

app_state = AppState()

# ===================== 工具函数 =====================

def get_stats() -> dict:
    """获取系统统计信息"""
    posts_count = len(list(POSTS_DIR.glob("*.md"))) if POSTS_DIR.exists() else 0
    
    # 获取今天的标题文件
    today = datetime.now().strftime("%Y%m%d")
    titles_file = TODO_DIR / f"{today}_titles.txt"
    titles_count = 0
    if titles_file.exists():
        with open(titles_file, 'r', encoding='utf-8') as f:
            titles_count = len([line for line in f if line.strip()])
    
    return {
        "posts_count": posts_count,
        "posts_limit": POSTS_LIMIT,
        "titles_count": titles_count,
        "api_key_set": bool(app_state.api_key)
    }

def format_stats_display() -> str:
    """格式化统计信息显示"""
    stats = get_stats()
    
    status = f"""
### 📊 系统状态

- **API Key**: {'✅ 已设置' if stats['api_key_set'] else '❌ 未设置'}
- **待发布文章**: {stats['posts_count']} / {stats['posts_limit']} 篇
- **今日标题库**: {stats['titles_count']} 个
    """
    return status.strip()

def read_posts_list() -> List[Tuple[str, str]]:
    """读取待发布文章列表"""
    if not POSTS_DIR.exists():
        return []
    
    posts = []
    for md_file in sorted(POSTS_DIR.glob("*.md")):
        title = md_file.stem
        size = md_file.stat().st_size
        posts.append((title, f"{size} bytes"))
    
    return posts

def read_titles_list(date_str: str = None) -> List[str]:
    """读取标题列表"""
    if not date_str:
        date_str = datetime.now().strftime("%Y%m%d")
    
    titles_file = TODO_DIR / f"{date_str}_titles.txt"
    if not titles_file.exists():
        return []
    
    with open(titles_file, 'r', encoding='utf-8') as f:
        titles = [line.strip() for line in f if line.strip()]
    
    return titles

def read_article_content(title: str) -> str:
    """读取文章内容"""
    file_path = POSTS_DIR / f"{title}.md"
    if not file_path.exists():
        return "文章不存在"
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    return content

# ===================== 核心功能函数 =====================

def search_news(days: int, topics_str: str, count: int, progress=gr.Progress()) -> Tuple[str, str]:
    """搜索技术新闻"""
    try:
        # 初始化组件
        if not app_state.news_searcher:
            app_state.init_components()
        
        progress(0, desc="🔍 开始搜索新闻...")
        
        # 解析主题
        if topics_str.strip():
            topics = [t.strip() for t in topics_str.split(',') if t.strip()]
        else:
            topics = None
        
        # 搜索新闻
        progress(0.3, desc="🌐 正在搜索新闻...")
        news_list = app_state.news_searcher.search_tech_news(
            days_ago=days,
            topics=topics
        )
        
        if not news_list:
            return "❌ 未搜索到新闻", format_stats_display()
        
        progress(0.6, desc="🤖 正在提取关键信息...")
        
        # 提取关键信息
        selected_news = app_state.news_searcher._parse_search_results(news_list, count)
        
        progress(0.9, desc="💾 保存搜索结果...")
        
        # 保存结果
        today = datetime.now().strftime("%Y%m%d")
        app_state.news_searcher.save_news_info(selected_news, today)
        
        app_state.search_results = selected_news
        
        progress(1.0, desc="✅ 搜索完成！")
        
        result_text = f"""
### ✅ 新闻搜索完成

- **搜索范围**: 最近 {days} 天
- **搜索主题**: {len(topics) if topics else 15} 个
- **找到新闻**: {len(selected_news)} 条

**新闻列表**:
"""
        for i, news in enumerate(selected_news, 1):
            result_text += f"\n{i}. [{news['topic']}] {news['title']}"
        
        return result_text, format_stats_display()
        
    except Exception as e:
        return f"❌ 搜索失败: {str(e)}", format_stats_display()

def generate_titles(count: int, progress=gr.Progress()) -> Tuple[str, str, str]:
    """生成标题"""
    try:
        if not app_state.news_searcher or not app_state.search_results:
            return "❌ 请先搜索新闻", format_stats_display(), ""
        
        progress(0, desc="📝 开始生成标题...")
        
        # 生成标题
        titles_with_info = app_state.news_searcher.generate_titles_from_news(
            app_state.search_results,
            count=count
        )
        
        progress(0.7, desc="💾 保存标题信息...")
        
        # 保存标题
        today = datetime.now().strftime("%Y%m%d")
        app_state.news_searcher.save_titles_with_info(titles_with_info, today)
        
        app_state.titles_info = titles_with_info
        
        progress(1.0, desc="✅ 标题生成完成！")
        
        result_text = f"""
### ✅ 标题生成完成

- **生成数量**: {len(titles_with_info)} 个
- **保存位置**: todo/{today}_titles.txt

**标题列表**:
"""
        titles_dropdown = []
        for i, info in enumerate(titles_with_info, 1):
            title = info['optimized_title']
            result_text += f"\n{i}. {title}"
            titles_dropdown.append(title)
        
        return result_text, format_stats_display(), gr.Dropdown(choices=titles_dropdown)
        
    except Exception as e:
        return f"❌ 生成失败: {str(e)}", format_stats_display(), gr.Dropdown(choices=[])

def generate_articles(count: int, selected_titles: List[str], progress=gr.Progress()) -> Tuple[str, str]:
    """生成文章"""
    try:
        if not app_state.content_generator:
            app_state.init_components()
        
        # 确定要生成的标题
        if selected_titles:
            titles_to_generate = selected_titles
        else:
            # 从文件读取标题
            titles_list = read_titles_list()
            if not titles_list:
                return "❌ 没有可用的标题", format_stats_display()
            titles_to_generate = titles_list[:count]
        
        progress(0, desc=f"✍️ 准备生成 {len(titles_to_generate)} 篇文章...")
        
        # 检查 posts 目录
        current_count = len(list(POSTS_DIR.glob("*.md"))) if POSTS_DIR.exists() else 0
        available_slots = POSTS_LIMIT - current_count
        
        if available_slots <= 0:
            return f"❌ posts目录已满（{current_count}/{POSTS_LIMIT}），请先发布或删除文章", format_stats_display()
        
        actual_count = min(len(titles_to_generate), available_slots)
        titles_to_generate = titles_to_generate[:actual_count]
        
        # 读取标题信息
        today = datetime.now().strftime("%Y%m%d")
        titles_info_file = TODO_DIR / f"{today}_titles_info.json"
        
        titles_info_map = {}
        if titles_info_file.exists():
            with open(titles_info_file, 'r', encoding='utf-8') as f:
                titles_info_list = json.load(f)
                for info in titles_info_list:
                    titles_info_map[info['optimized_title']] = info
        
        # 生成文章
        generated = []
        failed = []
        
        for i, title in enumerate(titles_to_generate, 1):
            progress(i / len(titles_to_generate), desc=f"✍️ 生成第 {i}/{len(titles_to_generate)} 篇...")
            
            try:
                # 获取新闻背景
                title_info = titles_info_map.get(title)
                summary = title_info.get('summary', '') if title_info else ''
                topic = title_info.get('topic', '') if title_info else ''
                
                # 生成文章
                if summary:
                    # 带上下文生成
                    prompt = f"""请基于以下新闻背景，撰写一篇关于"{title}"的技术博客文章。

**新闻背景**：{summary}

**技术领域**：{topic}

**要求**：
1. 文章长度800-1500字
2. 结构清晰：引言、技术解析、应用场景、总结展望
3. 结合新闻背景，深入分析技术亮点
4. 突出创新点和实际应用价值
5. 语言专业但通俗易懂
6. 使用Markdown格式

请直接输出文章内容，不要包含标题（标题将自动添加）。"""
                    
                    article = app_state.content_generator.generate_article(prompt)
                else:
                    # 标准生成
                    article = app_state.content_generator.generate_article(
                        f"请撰写一篇关于'{title}'的技术博客"
                    )
                
                # 保存文章
                app_state.content_generator.save_article_to_posts(title, article)
                generated.append(title)
                
            except Exception as e:
                failed.append(f"{title}: {str(e)}")
        
        progress(1.0, desc="✅ 文章生成完成！")
        
        result_text = f"""
### ✅ 文章生成完成

- **成功生成**: {len(generated)} 篇
- **生成失败**: {len(failed)} 篇
- **保存位置**: posts/ 目录

**成功列表**:
"""
        for i, title in enumerate(generated, 1):
            result_text += f"\n{i}. {title}"
        
        if failed:
            result_text += "\n\n**失败列表**:\n"
            for item in failed:
                result_text += f"\n- {item}"
        
        return result_text, format_stats_display()
        
    except Exception as e:
        return f"❌ 生成失败: {str(e)}", format_stats_display()

def publish_articles(count: int, headless: bool, progress=gr.Progress()) -> Tuple[str, str]:
    """发布文章到CSDN"""
    try:
        progress(0, desc="🚀 准备发布...")
        
        # 获取待发布文章
        posts = list(POSTS_DIR.glob("*.md"))
        if not posts:
            return "❌ 没有待发布的文章", format_stats_display()
        
        posts = sorted(posts)[:count]
        
        result_text = f"""
### 🚀 开始发布到CSDN

- **待发布**: {len(posts)} 篇
- **模式**: {'无头模式' if headless else '可见模式'}

**发布进度**:
正在调用 publish_csdn.py 脚本...
"""
        
        progress(0.5, desc="📤 正在发布文章...")
        
        # 使用subprocess调用publish_csdn.py
        cmd = ["python", "publish_csdn.py"]
        if headless:
            cmd.extend(["--headless", "true"])
        else:
            cmd.extend(["--headless", "false"])
        
        # 运行发布脚本
        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=600  # 10分钟超时
            )
            
            progress(1.0, desc="✅ 发布完成！")
            
            # 解析输出
            if result.returncode == 0:
                result_text += f"""

### ✅ 发布完成

**输出信息**:
```
{result.stdout}
```
"""
            else:
                result_text += f"""

### ❌ 发布失败

**错误信息**:
```
{result.stderr}
```
"""
        except subprocess.TimeoutExpired:
            result_text += "\n\n### ⏱️ 发布超时（超过10分钟）"
        except Exception as e:
            result_text += f"\n\n### ❌ 执行失败: {str(e)}"
        
        return result_text, format_stats_display()
        
    except Exception as e:
        return f"❌ 发布失败: {str(e)}", format_stats_display()

def delete_article(title: str) -> Tuple[str, str]:
    """删除文章"""
    try:
        file_path = POSTS_DIR / f"{title}.md"
        if not file_path.exists():
            return "❌ 文章不存在", format_stats_display()
        
        file_path.unlink()
        return f"✅ 已删除文章: {title}", format_stats_display()
        
    except Exception as e:
        return f"❌ 删除失败: {str(e)}", format_stats_display()

def preview_article(title: str) -> str:
    """预览文章"""
    if not title:
        return "请选择要预览的文章"
    
    content = read_article_content(title)
    return f"# {title}\n\n{content}"

# ===================== 构建界面 =====================

def create_ui():
    """创建 Gradio 界面"""
    
    with gr.Blocks(
        title="CSDN自动发布系统",
        theme=gr.themes.Soft(),
        css="""
        .container {max-width: 1200px; margin: auto;}
        .stat-box {padding: 20px; background: #f0f0f0; border-radius: 10px; margin: 10px 0;}
        """
    ) as app:
        
        gr.Markdown("""
        # 🚀 CSDN自动发布系统 v2.1.0
        
        **功能**: 智能新闻搜索 → AI内容生成 → 自动CSDN发布
        """)
        
        # 全局状态显示
        stats_display = gr.Markdown(format_stats_display(), elem_classes="stat-box")
        
        # Tab 1: 配置
        with gr.Tab("⚙️ 系统配置"):
            gr.Markdown("### API Key 配置")
            
            with gr.Row():
                api_key_input = gr.Textbox(
                    label="智谱AI API Key",
                    placeholder="请输入您的 API Key",
                    type="password",
                    value=app_state.api_key
                )
                
            init_btn = gr.Button("💾 保存并初始化", variant="primary")
            init_output = gr.Textbox(label="初始化状态", lines=2)
            
            init_btn.click(
                fn=lambda key: (app_state.init_components(key), format_stats_display()),
                inputs=[api_key_input],
                outputs=[init_output, stats_display]
            )
            
            gr.Markdown("""
            ### 📖 使用说明
            
            1. **设置 API Key**: 输入智谱AI的API Key并点击保存
            2. **搜索新闻**: 在"新闻搜索"标签页搜索技术新闻
            3. **生成标题**: 基于搜索结果生成优化的博客标题
            4. **生成文章**: 基于标题和新闻背景生成文章
            5. **发布文章**: 一键发布到CSDN
            
            💡 **提示**: 建议按顺序操作，每步完成后查看状态栏
            """)
        
        # Tab 2: 新闻搜索
        with gr.Tab("🔍 新闻搜索"):
            gr.Markdown("### 搜索技术新闻")
            
            with gr.Row():
                with gr.Column(scale=1):
                    days_input = gr.Slider(
                        label="搜索天数",
                        minimum=1,
                        maximum=7,
                        value=1,
                        step=1,
                        info="搜索最近几天的新闻"
                    )
                    
                    topics_input = gr.Textbox(
                        label="自定义主题（可选）",
                        placeholder="用逗号分隔，例如: 大模型,AGI,多模态AI",
                        lines=2,
                        info="留空则使用默认15个主题"
                    )
                    
                    news_count = gr.Slider(
                        label="提取新闻数量",
                        minimum=5,
                        maximum=30,
                        value=15,
                        step=1
                    )
                    
                    search_btn = gr.Button("🔍 开始搜索", variant="primary")
                
                with gr.Column(scale=2):
                    search_output = gr.Markdown("等待搜索...")
            
            search_btn.click(
                fn=search_news,
                inputs=[days_input, topics_input, news_count],
                outputs=[search_output, stats_display]
            )
        
        # Tab 3: 标题生成
        with gr.Tab("📝 标题生成"):
            gr.Markdown("### 生成优化的博客标题")
            
            with gr.Row():
                with gr.Column(scale=1):
                    title_count = gr.Slider(
                        label="生成标题数量",
                        minimum=5,
                        maximum=30,
                        value=15,
                        step=1
                    )
                    
                    gen_title_btn = gr.Button("📝 生成标题", variant="primary")
                
                with gr.Column(scale=2):
                    title_output = gr.Markdown("等待生成...")
            
            # 标题选择（用于后续生成文章）
            selected_titles = gr.Dropdown(
                label="选择要生成文章的标题（可多选）",
                choices=[],
                multiselect=True,
                interactive=True,
                info="可以选择特定标题生成文章，不选则按顺序生成"
            )
            
            gen_title_btn.click(
                fn=generate_titles,
                inputs=[title_count],
                outputs=[title_output, stats_display, selected_titles]
            )
        
        # Tab 4: 文章生成
        with gr.Tab("✍️ 文章生成"):
            gr.Markdown("### 生成技术博客文章")
            
            with gr.Row():
                with gr.Column(scale=1):
                    article_count = gr.Slider(
                        label="生成文章数量",
                        minimum=1,
                        maximum=20,
                        value=5,
                        step=1
                    )
                    
                    gen_article_btn = gr.Button("✍️ 开始生成", variant="primary")
                    
                    gr.Markdown("""
                    **提示**:
                    - 如果在"标题生成"中选择了特定标题，将只生成选中的文章
                    - 否则按顺序从标题库生成
                    - 文章会自动保存到 posts/ 目录
                    """)
                
                with gr.Column(scale=2):
                    article_output = gr.Markdown("等待生成...")
            
            gen_article_btn.click(
                fn=generate_articles,
                inputs=[article_count, selected_titles],
                outputs=[article_output, stats_display]
            )
        
        # Tab 5: 文章管理
        with gr.Tab("📚 文章管理"):
            gr.Markdown("### 管理待发布文章")
            
            with gr.Row():
                with gr.Column(scale=1):
                    refresh_btn = gr.Button("🔄 刷新列表")
                    
                    posts_list = gr.Dropdown(
                        label="选择文章",
                        choices=[title for title, _ in read_posts_list()],
                        interactive=True
                    )
                    
                    with gr.Row():
                        preview_btn = gr.Button("👁️ 预览", variant="secondary")
                        delete_btn = gr.Button("🗑️ 删除", variant="stop")
                    
                    delete_output = gr.Textbox(label="操作结果", lines=2)
                
                with gr.Column(scale=2):
                    preview_content = gr.Markdown("选择文章后点击预览")
            
            refresh_btn.click(
                fn=lambda: gr.Dropdown(choices=[title for title, _ in read_posts_list()]),
                outputs=[posts_list]
            )
            
            preview_btn.click(
                fn=preview_article,
                inputs=[posts_list],
                outputs=[preview_content]
            )
            
            delete_btn.click(
                fn=delete_article,
                inputs=[posts_list],
                outputs=[delete_output, stats_display]
            )
        
        # Tab 6: CSDN发布
        with gr.Tab("🚀 CSDN发布"):
            gr.Markdown("### 发布文章到CSDN")
            
            with gr.Row():
                with gr.Column(scale=1):
                    publish_count = gr.Slider(
                        label="发布数量",
                        minimum=1,
                        maximum=16,
                        value=5,
                        step=1,
                        info="一次发布多少篇文章"
                    )
                    
                    headless_mode = gr.Checkbox(
                        label="无头模式",
                        value=False,
                        info="勾选后浏览器将在后台运行（不可见）"
                    )
                    
                    publish_btn = gr.Button("🚀 开始发布", variant="primary")
                    
                    gr.Markdown("""
                    **注意事项**:
                    - 首次发布需要在浏览器中登录CSDN
                    - 登录状态会保存，后续无需重复登录
                    - 建议首次使用时不勾选"无头模式"
                    - 发布过程可能需要几分钟，请耐心等待
                    """)
                
                with gr.Column(scale=2):
                    publish_output = gr.Markdown("等待发布...")
            
            publish_btn.click(
                fn=publish_articles,
                inputs=[publish_count, headless_mode],
                outputs=[publish_output, stats_display]
            )
        
        # Tab 7: 一键流程
        with gr.Tab("⚡ 一键流程"):
            gr.Markdown("### 完整自动化流程")
            
            gr.Markdown("""
            这里提供完整的自动化流程，一键完成从搜索到生成的所有步骤。
            
            **流程说明**:
            1. 搜索最近的技术新闻
            2. 提取关键信息并生成标题
            3. 基于标题和新闻背景生成文章
            4. 文章保存到 posts 目录
            """)
            
            with gr.Row():
                with gr.Column(scale=1):
                    auto_days = gr.Slider(label="搜索天数", minimum=1, maximum=7, value=1, step=1)
                    auto_topics = gr.Textbox(
                        label="自定义主题（可选）",
                        placeholder="留空使用默认主题",
                        lines=2
                    )
                    auto_count = gr.Slider(label="生成文章数量", minimum=1, maximum=20, value=10, step=1)
                    
                    auto_run_btn = gr.Button("⚡ 一键运行", variant="primary")
                
                with gr.Column(scale=2):
                    auto_output = gr.Markdown("点击按钮开始...")
            
            def auto_workflow(days, topics_str, count, progress=gr.Progress()):
                """一键自动化流程"""
                result_text = "### ⚡ 开始自动化流程\n\n"
                
                # 步骤1: 搜索新闻
                progress(0.1, desc="🔍 步骤1: 搜索新闻...")
                search_result, _ = search_news(days, topics_str, count)
                result_text += f"**步骤1: 搜索新闻**\n{search_result}\n\n"
                
                if "❌" in search_result:
                    return result_text, format_stats_display()
                
                # 步骤2: 生成标题
                progress(0.4, desc="📝 步骤2: 生成标题...")
                title_result, _, _ = generate_titles(count)
                result_text += f"**步骤2: 生成标题**\n{title_result}\n\n"
                
                if "❌" in title_result:
                    return result_text, format_stats_display()
                
                # 步骤3: 生成文章
                progress(0.7, desc="✍️ 步骤3: 生成文章...")
                article_result, _ = generate_articles(count, [])
                result_text += f"**步骤3: 生成文章**\n{article_result}\n\n"
                
                progress(1.0, desc="✅ 流程完成！")
                result_text += "\n### ✅ 自动化流程完成！\n\n现在可以前往 'CSDN发布' 标签页发布文章。"
                
                return result_text, format_stats_display()
            
            auto_run_btn.click(
                fn=auto_workflow,
                inputs=[auto_days, auto_topics, auto_count],
                outputs=[auto_output, stats_display]
            )
        
        # 页脚
        gr.Markdown("""
        ---
        
        <div style="text-align: center; color: #666;">
            <p><strong>CSDN自动发布系统 v2.1.0</strong> | 基于智谱AI + Playwright</p>
            <p>💡 提示: 遇到问题请查看终端输出或查阅文档</p>
        </div>
        """)
    
    return app

# ===================== 主函数 =====================

def main():
    """主函数"""
    # 创建必要的目录
    POSTS_DIR.mkdir(exist_ok=True)
    TODO_DIR.mkdir(exist_ok=True)
    
    # 检查 API Key
    if not app_state.api_key:
        print("⚠️  警告: 未检测到 ZHIPUAI_API_KEY 环境变量")
        print("请在界面中配置 API Key 或设置环境变量")
    else:
        print(f"✓ API Key 已设置: {app_state.api_key[:10]}...")
    
    # 创建并启动界面
    app = create_ui()
    
    print("\n" + "="*60)
    print("🚀 CSDN自动发布系统 - Web界面")
    print("="*60)
    print("\n正在启动 Gradio 服务器...")
    print("\n界面将在浏览器中自动打开")
    print("如未自动打开，请手动访问显示的地址\n")
    
    # 启用队列以支持进度追踪
    app.queue()
    
    app.launch(
        server_name="0.0.0.0",
        server_port=7860,
        share=False,
        inbrowser=True,
        show_error=True
    )

if __name__ == "__main__":
    main()
