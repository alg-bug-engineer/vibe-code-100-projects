"""
微信公众号自动发文脚本
实现功能：
1. 登录微信公众号后台
2. 点击文章按钮
3. 填写标题、正文、作者
4. 保存为草稿
"""

import asyncio
import time
from playwright.async_api import async_playwright, Page, expect


class WeChatMPAutomation:
    def __init__(self):
        self.browser = None
        self.context = None
        self.page = None
        
    async def start(self):
        """启动浏览器"""
        playwright = await async_playwright().start()
        # 使用 chromium，设置为非无头模式以便扫码登录
        self.browser = await playwright.chromium.launch(
            headless=False,
            args=['--start-maximized']
        )
        # 创建浏览器上下文，设置视口大小
        self.context = await self.browser.new_context(
            viewport={'width': 1920, 'height': 1080}
        )
        self.page = await self.context.new_page()
        
    async def login(self, url="https://mp.weixin.qq.com/"):
        """
        打开登录页面，等待用户扫码登录
        """
        print("正在打开微信公众号登录页面...")
        await self.page.goto(url)
        
        print("请使用微信扫码登录...")
        print("等待跳转到主页面...")
        
        # 等待登录成功后跳转到主页
        # 登录成功后，URL会变化，通常会包含 'cgi-bin' 或者会出现特定的元素
        try:
            # 等待登录成功的标志：URL变化或特定元素出现
            # 这里我们等待URL包含特定路径，或者等待主页面的特定元素
            await self.page.wait_for_url("**/cgi-bin/**", timeout=120000)  # 2分钟超时
            print("✓ 登录成功！")
            await asyncio.sleep(2)  # 等待页面完全加载
        except Exception as e:
            print(f"等待登录超时或失败: {e}")
            # 尝试另一种方式：等待页面上出现特定元素
            try:
                await self.page.wait_for_selector(".new-creation__menu-content", timeout=60000)
                print("✓ 登录成功（通过元素检测）！")
            except:
                print("❌ 无法确认登录状态，请检查")
                
    async def click_article_button(self):
        """
        点击文章按钮，会在新标签页打开
        """
        print("\n正在查找文章按钮...")
        
        try:
            # 等待文章按钮出现
            article_button = await self.page.wait_for_selector(
                ".new-creation__menu-content:has-text('文章')",
                timeout=10000
            )
            
            print("找到文章按钮，准备点击...")
            
            # 监听新标签页的打开
            async with self.context.expect_page() as new_page_info:
                await article_button.click()
                
            # 获取新打开的标签页
            new_page = await new_page_info.value
            await new_page.wait_for_load_state('domcontentloaded')
            print("✓ 文章编辑页面已在新标签页打开！")
            
            # 切换到新标签页
            self.article_page = new_page
            return new_page
            
        except Exception as e:
            print(f"❌ 点击文章按钮失败: {e}")
            raise
            
    async def fill_article(self, title, content, author):
        """
        填写文章标题、正文和作者
        
        Args:
            title: 文章标题
            content: 文章正文
            author: 作者名称
        """
        print("\n开始填写文章内容...")
        page = self.article_page
        
        try:
            # 1. 填写标题
            print("正在填写标题...")
            title_input = await page.wait_for_selector("#title", timeout=10000)
            await title_input.click()  # 先点击
            await asyncio.sleep(0.5)
            await title_input.fill(title)  # 填写标题
            print(f"✓ 标题已填写: {title}")
            
            # 2. 填写正文
            print("正在填写正文...")
            # 等待富文本编辑器加载
            content_editor = await page.wait_for_selector(
                ".ProseMirror[contenteditable='true']",
                timeout=10000
            )
            await content_editor.click()  # 先点击激活编辑器
            await asyncio.sleep(0.5)
            
            # 清空占位符并输入内容
            await content_editor.fill("")  # 先清空
            await asyncio.sleep(0.3)
            
            # 使用 JavaScript 设置内容（更可靠）
            await page.evaluate(f"""
                const editor = document.querySelector('.ProseMirror[contenteditable="true"]');
                editor.innerHTML = '<section><span leaf="">{content}</span></section>';
            """)
            print(f"✓ 正文已填写")
            
            # 3. 填写作者
            print("正在填写作者...")
            author_input = await page.wait_for_selector("#author", timeout=10000)
            await author_input.click()  # 先点击
            await asyncio.sleep(0.5)
            await author_input.fill(author)  # 填写作者
            print(f"✓ 作者已填写: {author}")
            
            await asyncio.sleep(1)  # 等待一下确保内容已保存
            
        except Exception as e:
            print(f"❌ 填写文章内容失败: {e}")
            raise
            
    async def save_as_draft(self):
        """
        点击保存为草稿按钮
        """
        print("\n正在保存为草稿...")
        page = self.article_page
        
        try:
            # 查找保存为草稿按钮
            save_button = await page.wait_for_selector(
                "#js_submit button",
                timeout=10000
            )
            
            print("找到保存按钮，准备点击...")
            await save_button.click()
            
            # 等待保存成功的提示或者按钮文字变化
            await asyncio.sleep(2)
            
            # 检查是否有成功提示
            try:
                # 可能会有toast提示
                success_msg = await page.wait_for_selector(
                    ".weui-desktop-toast__content:has-text('保存成功')",
                    timeout=3000
                )
                print("✓ 文章已保存为草稿！")
            except:
                # 如果没有找到提示，也认为保存成功（因为没有报错）
                print("✓ 保存命令已执行")
                
        except Exception as e:
            print(f"❌ 保存草稿失败: {e}")
            raise
            
    async def run(self, title, content, author):
        """
        执行完整的自动化流程
        
        Args:
            title: 文章标题
            content: 文章正文
            author: 作者名称
        """
        try:
            # 1. 启动浏览器
            await self.start()
            
            # 2. 登录
            await self.login()
            
            # 3. 点击文章按钮（会打开新标签页）
            await self.click_article_button()
            
            # 4. 填写文章内容
            await self.fill_article(title, content, author)
            
            # 5. 保存为草稿
            await self.save_as_draft()
            
            print("\n" + "="*50)
            print("✓ 所有操作已完成！")
            print("="*50)
            
            # 等待一段时间让用户查看结果
            print("\n浏览器将在10秒后关闭...")
            await asyncio.sleep(10)
            
        except Exception as e:
            print(f"\n❌ 执行过程中出现错误: {e}")
            print("浏览器将在30秒后关闭，请检查...")
            await asyncio.sleep(30)
            
        finally:
            # 关闭浏览器
            if self.browser:
                await self.browser.close()
                print("浏览器已关闭")


async def main():
    """
    主函数
    """
    # 创建自动化实例
    automation = WeChatMPAutomation()
    
    # 设置文章信息
    article_title = "这是一篇测试文章"
    article_content = "这是文章的正文内容，可以包含多段文字。这是一个自动化测试示例。"
    article_author = "测试作者"
    
    print("="*50)
    print("微信公众号自动发文脚本")
    print("="*50)
    print(f"\n文章标题: {article_title}")
    print(f"文章作者: {article_author}")
    print(f"正文预览: {article_content[:50]}...")
    print("\n" + "="*50)
    
    # 执行自动化流程
    await automation.run(article_title, article_content, article_author)


if __name__ == "__main__":
    # 运行主函数
    asyncio.run(main())
