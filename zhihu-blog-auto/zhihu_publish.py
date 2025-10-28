import asyncio
import os
import random
import json
from pathlib import Path
from datetime import datetime
from playwright.async_api import async_playwright, Page

# --- 配置 ---
STATE_FILE_PATH = 'zhihu_state.json'
WRITE_URL = 'https://zhuanlan.zhihu.com/write'
POSTS_DIR = 'posts'  # markdown 文件目录
PUBLISH_LOG_FILE = 'publish_log.json'  # 发布记录日志

# 发布间隔配置 (秒)
MIN_INTERVAL = 300  # 最小间隔 5 分钟
MAX_INTERVAL = 600  # 最大间隔 10 分钟

# 随机延迟函数
async def random_delay(min_ms=500, max_ms=2000):
    """模拟人类操作的随机延迟"""
    delay = random.uniform(min_ms, max_ms) / 1000
    await asyncio.sleep(delay)


def load_publish_log():
    """加载发布记录"""
    if os.path.exists(PUBLISH_LOG_FILE):
        with open(PUBLISH_LOG_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {}


def save_publish_log(log_data):
    """保存发布记录"""
    with open(PUBLISH_LOG_FILE, 'w', encoding='utf-8') as f:
        json.dump(log_data, f, ensure_ascii=False, indent=2)


def get_markdown_files():
    """获取 posts 目录下所有未发布的 markdown 文件"""
    posts_path = Path(POSTS_DIR)
    if not posts_path.exists():
        print(f"错误: 目录 '{POSTS_DIR}' 不存在！")
        return []
    
    # 获取所有 .md 文件
    md_files = list(posts_path.glob('*.md'))
    
    # 加载发布记录
    publish_log = load_publish_log()
    
    # 过滤出未发布的文件
    unpublished_files = []
    for md_file in md_files:
        file_name = md_file.name
        if file_name not in publish_log or not publish_log[file_name].get('published', False):
            unpublished_files.append(md_file)
    
    return sorted(unpublished_files)  # 按文件名排序


def read_markdown_file(file_path):
    """读取 markdown 文件,提取标题和内容"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read().strip()
    
    # 文件名作为标题 (去掉 .md 后缀)
    title = file_path.stem
    
    # 内容就是整个 markdown 文件内容
    body = content
    
    return title, body

# --- Playwright 选择器 (可能会随知乎页面更新而变化) ---
# 标题输入框
TITLE_SELECTOR = '[placeholder^="请输入标题"]' # 已更新：使用“开头匹配”来提高稳定性
# 内容输入框 (基于 Draft.js 的编辑器)
BODY_SELECTOR = 'div.DraftEditor-editorContainer > div.public-DraftEditor-content'
# "发布" 按钮 (在编辑器顶部)
PUBLISH_BUTTON_SELECTOR = 'button:text("发布")'
# "确认发布" 按钮 (在弹出的模态框中)
MODAL_CONFIRM_SELECTOR = 'div[role="dialog"] button:text("确认发布")'


async def post_article(page: Page, title: str, body: str):
    """
    导航到写作页面并发布文章的函数
    
    Args:
        page: Playwright 页面对象
        title: 文章标题
        body: 文章内容
    """
    print("正在导航到写作页面...")
    await page.goto(WRITE_URL)

    try:
        # 1. 等待标题输入框加载
        print("等待编辑器加载...")
        await page.wait_for_selector(TITLE_SELECTOR, timeout=30000)
        print("编辑器已加载。")
        await random_delay(1000, 2000)  # 等待后添加随机延迟

        # 2. 填充标题 - 模拟人类逐字输入
        print(f"正在填充标题: {title}")
        title_input = page.locator(TITLE_SELECTOR)
        await title_input.click()
        await random_delay(500, 1000)
        # 逐字输入标题,模拟人类打字
        for char in title:
            await page.keyboard.type(char, delay=random.uniform(50, 150))
        await random_delay(800, 1500)

        # 3. 填充正文 - 模拟人类逐字输入
        print("正在填充正文...")
        await page.locator(BODY_SELECTOR).click()
        await random_delay(500, 1000)
        # 逐字输入正文,模拟人类打字
        for char in body:
            await page.keyboard.type(char, delay=random.uniform(50, 150))
        
        # 模拟人类思考和检查内容
        await random_delay(2000, 4000)
        
        # 随机滚动页面,模拟人类检查内容
        await page.mouse.wheel(0, random.randint(100, 300))
        await random_delay(1000, 2000)
        await page.mouse.wheel(0, -random.randint(100, 300))
        await random_delay(1000, 2000)

        # 4. 点击 "发布" 按钮
        print("点击发布按钮...")
        publish_btn = page.locator(PUBLISH_BUTTON_SELECTOR)
        # 先移动鼠标到按钮上
        await publish_btn.hover()
        await random_delay(500, 1000)
        await publish_btn.click()

        # 5. 等待并点击 "确认发布" 模态框
        print("等待确认发布模态框...")
        await page.wait_for_selector(MODAL_CONFIRM_SELECTOR, timeout=10000)
        await random_delay(1000, 2000)  # 模拟人类阅读确认框
        print("点击确认发布...")
        confirm_btn = page.locator(MODAL_CONFIRM_SELECTOR)
        await confirm_btn.hover()
        await random_delay(500, 800)
        await confirm_btn.click()

        # 6. 等待发布成功（页面会跳转到发布的文章）
        print("等待文章发布跳转...")
        # 等待 URL 变为已发布的文章链接，格式如 /p/123456789
        await page.wait_for_url(lambda url: "zhuanlan.zhihu.com/p/" in url and not url.endswith("/edit"), timeout=60000)

        article_url = page.url
        print(f"✓ 文章发布成功！新文章链接: {article_url}")
        return article_url

    except Exception as e:
        print(f"✗ 发布文章时出错: {e}")
        print("将截取屏幕快照 'error_screenshot.png' 以供调试。")
        await page.screenshot(path='error_screenshot.png')
        raise


async def main():
    async with async_playwright() as p:
        # 启动一个非无头的浏览器（这样才能扫码登录）
        # 添加更多反检测参数
        browser = await p.chromium.launch(
            headless=False,
            args=[
                '--disable-blink-features=AutomationControlled',  # 禁用自动化控制特征
                '--disable-dev-shm-usage',
                '--no-sandbox',
            ]
        )
        context = None

        try:
            # 创建上下文时设置更真实的浏览器环境
            context_options = {
                'viewport': {'width': 1920, 'height': 1080},
                'user_agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'locale': 'zh-CN',
                'timezone_id': 'Asia/Shanghai',
            }
            
            if os.path.exists(STATE_FILE_PATH):
                # --- 1. 加载状态 ---
                print(f"找到状态文件 '{STATE_FILE_PATH}'，正在加载登录状态...")
                context = await browser.new_context(
                    storage_state=STATE_FILE_PATH,
                    **context_options
                )
                print("登录状态加载成功。")

            else:
                # --- 2. 手动登录并保存状态 ---
                print(f"未找到状态文件 '{STATE_FILE_PATH}'。")
                print("请在打开的浏览器中手动登录（例如扫码）。")
                
                context = await browser.new_context(**context_options)
                page = await context.new_page()
                
                # 添加反检测脚本
                await page.add_init_script("""
                    // 覆盖 navigator.webdriver
                    Object.defineProperty(navigator, 'webdriver', {
                        get: () => undefined
                    });
                    
                    // 添加 Chrome 对象
                    window.chrome = {
                        runtime: {}
                    };
                    
                    // 覆盖 permissions
                    const originalQuery = window.navigator.permissions.query;
                    window.navigator.permissions.query = (parameters) => (
                        parameters.name === 'notifications' ?
                            Promise.resolve({ state: Notification.permission }) :
                            originalQuery(parameters)
                    );
                """)
                
                # 打开知乎首页，它会自动跳转到登录（如果需要）
                await page.goto("https://www.zhihu.com/")

                print("="*50)
                print(">>> 脚本已暂停 <<<")
                print("请在浏览器中完成登录操作。")
                print("登录成功后，请在 Playwright 检查器窗口中点击 'Resume' (▶️ 按钮) 继续。")
                print("="*50)
                
                # 暂停脚本，等待用户手动操作
                await page.pause() 
                
                # 用户点击 "Resume" 后，脚本继续
                print("脚本已恢复。正在保存登录状态...")
                
                # 确保我们登录成功了（简单检查：能否访问写作页面）
                await page.goto(WRITE_URL)
                await page.wait_for_selector(TITLE_SELECTOR, timeout=30000) # 等待编辑器加载
                
                # 保存状态
                await context.storage_state(path=STATE_FILE_PATH)
                print(f"登录状态已成功保存到 '{STATE_FILE_PATH}'。")
                await page.close()


            # --- 3. 执行发布逻辑 ---
            # 无论我们是加载了状态还是刚刚登录，现在 context 都应该是已登录的
            
            # 获取所有未发布的 markdown 文件
            md_files = get_markdown_files()
            
            if not md_files:
                print("没有找到未发布的 markdown 文件。")
                return
            
            print(f"\n发现 {len(md_files)} 个未发布的文件:")
            for idx, file in enumerate(md_files, 1):
                print(f"  {idx}. {file.name}")
            print()
            
            # 加载发布日志
            publish_log = load_publish_log()
            
            # 逐个发布文章
            for idx, md_file in enumerate(md_files, 1):
                try:
                    print("=" * 70)
                    print(f"正在处理第 {idx}/{len(md_files)} 个文件: {md_file.name}")
                    print("=" * 70)
                    
                    # 读取 markdown 文件
                    title, body = read_markdown_file(md_file)
                    print(f"文章标题: {title}")
                    print(f"文章长度: {len(body)} 字符\n")
                    
                    # 创建新页面并添加反检测脚本
                    page = await context.new_page()
                    
                    await page.add_init_script("""
                        // 覆盖 navigator.webdriver
                        Object.defineProperty(navigator, 'webdriver', {
                            get: () => undefined
                        });
                        
                        // 添加 Chrome 对象
                        window.chrome = {
                            runtime: {}
                        };
                        
                        // 覆盖 permissions
                        const originalQuery = window.navigator.permissions.query;
                        window.navigator.permissions.query = (parameters) => (
                            parameters.name === 'notifications' ?
                                Promise.resolve({ state: Notification.permission }) :
                                originalQuery(parameters)
                        );
                    """)
                    
                    # 发布文章
                    article_url = await post_article(page, title, body)
                    
                    # 记录发布成功
                    publish_log[md_file.name] = {
                        'published': True,
                        'url': article_url,
                        'timestamp': datetime.now().isoformat(),
                        'title': title
                    }
                    save_publish_log(publish_log)
                    
                    # 关闭页面
                    await page.close()
                    
                    print(f"✓ 文章 '{md_file.name}' 发布成功！")
                    
                    # 如果不是最后一篇文章，则等待随机间隔
                    if idx < len(md_files):
                        wait_time = random.randint(MIN_INTERVAL, MAX_INTERVAL)
                        print(f"\n⏱  等待 {wait_time} 秒后发布下一篇文章...")
                        print(f"   (模拟人类行为，避免频繁操作)")
                        
                        # 显示倒计时
                        for remaining in range(wait_time, 0, -30):
                            if remaining <= 30:
                                print(f"   还剩 {remaining} 秒...")
                            elif remaining % 60 == 0:
                                print(f"   还剩 {remaining // 60} 分钟...")
                            await asyncio.sleep(min(30, remaining))
                        
                        print()
                    
                except Exception as e:
                    print(f"\n✗ 发布文章 '{md_file.name}' 时出错: {e}")
                    print(f"   跳过该文件，继续处理下一个...\n")
                    
                    # 记录失败
                    publish_log[md_file.name] = {
                        'published': False,
                        'error': str(e),
                        'timestamp': datetime.now().isoformat(),
                        'title': title if 'title' in locals() else 'Unknown'
                    }
                    save_publish_log(publish_log)
                    
                    # 确保页面被关闭
                    try:
                        if 'page' in locals():
                            await page.close()
                    except:
                        pass
                    
                    # 出错后等待一段时间再继续
                    if idx < len(md_files):
                        wait_time = random.randint(60, 120)
                        print(f"   等待 {wait_time} 秒后继续...\n")
                        await asyncio.sleep(wait_time)
            
            print("\n" + "=" * 70)
            print("所有文章处理完成！")
            print("=" * 70)
            
            # 统计结果
            success_count = sum(1 for v in publish_log.values() if v.get('published', False))
            total_count = len(publish_log)
            print(f"成功发布: {success_count}/{total_count}")
            print(f"发布日志已保存到: {PUBLISH_LOG_FILE}")
            print()

        except Exception as e:
            print(f"脚本执行过程中发生错误: {e}")

        finally:
            # --- 4. 清理 ---
            if context:
                await context.close()
            await browser.close()
            print("浏览器已关闭。")

if __name__ == "__main__":
    asyncio.run(main())

