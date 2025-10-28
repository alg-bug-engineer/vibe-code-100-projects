import asyncio
import os
import random
from playwright.async_api import async_playwright, Page

# --- 配置 ---
STATE_FILE_PATH = 'zhihu_state.json'
WRITE_URL = 'https://zhuanlan.zhihu.com/write'

# 随机延迟函数
async def random_delay(min_ms=500, max_ms=2000):
    """模拟人类操作的随机延迟"""
    delay = random.uniform(min_ms, max_ms) / 1000
    await asyncio.sleep(delay)

# --- 文章内容 ---
ARTICLE_TITLE = "这是我的自动发布测试标题"
ARTICLE_BODY = """
这是文章的第一段内容。

这是第二段，使用 Playwright 自动输入。
"""

# --- Playwright 选择器 (可能会随知乎页面更新而变化) ---
# 标题输入框
TITLE_SELECTOR = '[placeholder^="请输入标题"]' # 已更新：使用“开头匹配”来提高稳定性
# 内容输入框 (基于 Draft.js 的编辑器)
BODY_SELECTOR = 'div.DraftEditor-editorContainer > div.public-DraftEditor-content'
# "发布" 按钮 (在编辑器顶部)
PUBLISH_BUTTON_SELECTOR = 'button:text("发布")'
# "确认发布" 按钮 (在弹出的模态框中)
MODAL_CONFIRM_SELECTOR = 'div[role="dialog"] button:text("确认发布")'


async def post_article(page: Page):
    """
    导航到写作页面并发布文章的函数
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
        print(f"正在填充标题: {ARTICLE_TITLE}")
        title_input = page.locator(TITLE_SELECTOR)
        await title_input.click()
        await random_delay(500, 1000)
        # 逐字输入标题,模拟人类打字
        for char in ARTICLE_TITLE:
            await page.keyboard.type(char, delay=random.uniform(50, 150))
        await random_delay(800, 1500)

        # 3. 填充正文 - 模拟人类逐字输入
        print("正在填充正文...")
        await page.locator(BODY_SELECTOR).click()
        await random_delay(500, 1000)
        # 逐字输入正文,模拟人类打字
        for char in ARTICLE_BODY:
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

        print(f"文章发布成功！新文章链接: {page.url}")

    except Exception as e:
        print(f"发布文章时出错: {e}")
        print("将截取屏幕快照 'error_screenshot.png' 以供调试。")
        await page.screenshot(path='error_screenshot.png')


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
            page = await context.new_page()
            
            # 为新页面也添加反检测脚本
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
            
            await post_article(page)

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

