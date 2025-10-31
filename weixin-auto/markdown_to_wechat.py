"""
Markdown 文章自动发布到微信公众号脚本
实现功能：
1. 读取本地 posts 文件夹下的 markdown 文件
2. 使用 md.doocs.org 转换 markdown 为富文本格式
3. 复制格式化后的内容
4. 粘贴到微信公众号编辑器
5. 保存为草稿
"""

import asyncio
import os
import shutil
from pathlib import Path
from playwright.async_api import async_playwright, Page


class MarkdownToWeChatAutomation:
    def __init__(self):
        self.browser = None
        self.context = None
        self.page = None
        self.article_page = None
        self.posts_dir = Path("posts")
        self.done_dir = Path("done")
        
    async def start(self):
        """启动浏览器"""
        playwright = await async_playwright().start()
        # 使用 chromium，设置为非无头模式
        self.browser = await playwright.chromium.launch(
            headless=False,
            args=['--start-maximized']
        )
        # 创建浏览器上下文
        self.context = await self.browser.new_context(
            viewport={'width': 1920, 'height': 1080}
        )
        self.page = await self.context.new_page()
        
    def ensure_directories(self):
        """确保 posts 和 done 文件夹存在"""
        if not self.posts_dir.exists():
            self.posts_dir.mkdir(parents=True)
            print(f"✓ 已创建 posts 文件夹: {self.posts_dir.absolute()}")
        
        if not self.done_dir.exists():
            self.done_dir.mkdir(parents=True)
            print(f"✓ 已创建 done 文件夹: {self.done_dir.absolute()}")
            
        return self.posts_dir, self.done_dir
        
    def get_markdown_files(self):
        """获取 posts 文件夹下的所有 markdown 文件"""
        self.ensure_directories()
        md_files = list(self.posts_dir.glob("*.md"))
        return md_files
        
    def read_markdown_file(self, file_path):
        """读取 markdown 文件内容"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            return content
        except Exception as e:
            print(f"❌ 读取文件失败 {file_path}: {e}")
            return None
    
    def move_to_done(self, file_path):
        """将处理完成的文件移动到 done 文件夹"""
        try:
            source_path = Path(file_path)
            target_path = self.done_dir / source_path.name
            
            # 如果目标文件已存在，添加时间戳避免冲突
            if target_path.exists():
                import datetime
                timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
                name_parts = source_path.stem, timestamp, source_path.suffix
                target_path = self.done_dir / f"{name_parts[0]}_{name_parts[1]}{name_parts[2]}"
            
            shutil.move(str(source_path), str(target_path))
            print(f"✓ 文件已移动到完成目录: {target_path.name}")
            return True
        except Exception as e:
            print(f"❌ 移动文件失败 {file_path}: {e}")
            return False
            
    async def convert_markdown_to_richtext(self, markdown_content):
        """
        使用 md.doocs.org 将 markdown 转换为富文本格式
        """
        print("\n正在打开 Markdown 编辑器...")
        await self.page.goto("https://md.doocs.org/")
        
        # 等待页面加载完成
        print("等待页面加载...")
        await asyncio.sleep(3)
        
        try:
            # 查找编辑器元素
            print("正在查找编辑器元素...")
            editor = await self.page.wait_for_selector(
                '.cm-content[contenteditable="true"]',
                timeout=10000
            )
            print("✓ 找到编辑器")
            
            # 点击编辑器获取焦点
            await editor.click()
            await asyncio.sleep(0.5)
            
            # 清空编辑器内容 - 使用 Ctrl+A 全选然后删除
            print("正在清空编辑器...")
            await self.page.keyboard.press("Meta+A" if os.uname().sysname == "Darwin" else "Control+A")
            await asyncio.sleep(0.3)
            await self.page.keyboard.press("Backspace")
            await asyncio.sleep(0.5)
            
            # 粘贴 markdown 内容
            print("正在粘贴 Markdown 内容...")
            # 使用 JavaScript 直接设置内容更可靠
            await self.page.evaluate(f"""
                const editor = document.querySelector('.cm-content[contenteditable="true"]');
                const content = {repr(markdown_content)};
                
                // 清空编辑器
                editor.textContent = '';
                
                // 触发输入事件
                editor.focus();
                document.execCommand('insertText', false, content);
            """)
            
            print("✓ Markdown 内容已粘贴")
            
            # 等待渲染完成 - 增加等待时间确保渲染完成
            print("等待 Markdown 渲染...")
            await asyncio.sleep(5)
            
            # 点击复制按钮
            print("正在查找复制按钮...")
            copy_button = await self.page.wait_for_selector(
                'button:has-text("复制")',
                timeout=10000
            )
            
            print("正在点击复制按钮...")
            await copy_button.click()
            
            # 等待复制完成 - 这个过程可能需要几秒
            print("等待复制完成（处理格式化内容）...")
            await asyncio.sleep(6)
            
            # 检查是否有成功提示
            try:
                # 可能会有成功提示的 toast
                await self.page.wait_for_selector(
                    'text=/复制成功|已复制/',
                    timeout=2000
                )
                print("✓ 内容已复制到剪贴板（检测到成功提示）")
            except:
                print("✓ 复制命令已执行（未检测到提示但继续执行）")
            
            return True
            
        except Exception as e:
            print(f"❌ Markdown 转换失败: {e}")
            import traceback
            traceback.print_exc()
            return False
            
    async def login_wechat(self, url="https://mp.weixin.qq.com/"):
        """
        打开微信公众号登录页面，等待用户扫码登录
        """
        print("\n正在打开微信公众号登录页面...")
        await self.page.goto(url)
        
        print("请使用微信扫码登录...")
        print("等待跳转到主页面...")
        
        try:
            # 等待登录成功
            await self.page.wait_for_url("**/cgi-bin/**", timeout=120000)
            print("✓ 登录成功！")
            await asyncio.sleep(2)
        except Exception as e:
            try:
                await self.page.wait_for_selector(".new-creation__menu-content", timeout=60000)
                print("✓ 登录成功（通过元素检测）！")
            except:
                print("❌ 无法确认登录状态")
                raise
                
    async def click_article_button(self):
        """
        点击文章按钮，在新标签页打开编辑器
        """
        print("\n正在查找文章按钮...")
        
        try:
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
            
    async def fill_article_with_paste(self, title, author):
        """
        填写文章标题和作者，正文内容通过粘贴富文本格式
        
        Args:
            title: 文章标题
            author: 作者名称
        """
        print("\n开始填写文章内容...")
        page = self.article_page
        
        try:
            # 1. 填写标题
            print("正在填写标题...")
            title_input = await page.wait_for_selector("#title", timeout=10000)
            await title_input.click()
            await asyncio.sleep(0.5)
            await title_input.fill(title)
            print(f"✓ 标题已填写: {title}")
            
            # 2. 粘贴正文（富文本格式）
            print("正在粘贴正文内容（富文本格式）...")
            # 等待富文本编辑器加载
            content_editor = await page.wait_for_selector(
                ".ProseMirror[contenteditable='true']",
                timeout=10000
            )
            
            # 点击编辑器获取焦点
            await content_editor.click()
            await asyncio.sleep(0.5)
            
            # 清空编辑器
            await page.keyboard.press("Meta+A" if os.uname().sysname == "Darwin" else "Control+A")
            await asyncio.sleep(0.3)
            await page.keyboard.press("Backspace")
            await asyncio.sleep(0.5)
            
            # 粘贴内容 - 使用 Cmd+V (macOS) 或 Ctrl+V (Windows/Linux)
            print("正在粘贴剪贴板内容...")
            if os.uname().sysname == "Darwin":
                await page.keyboard.press("Meta+V")
            else:
                await page.keyboard.press("Control+V")
                
            await asyncio.sleep(2)
            print("✓ 正文已粘贴（带格式）")
            
            # 3. 填写作者
            print("正在填写作者...")
            author_input = await page.wait_for_selector("#author", timeout=10000)
            await author_input.click()
            await asyncio.sleep(0.5)
            await author_input.fill(author)
            print(f"✓ 作者已填写: {author}")
            
            await asyncio.sleep(1)
            
        except Exception as e:
            print(f"❌ 填写文章内容失败: {e}")
            import traceback
            traceback.print_exc()
            raise
            
    async def save_as_draft(self):
        """
        点击保存为草稿按钮
        """
        print("\n正在保存为草稿...")
        page = self.article_page
        
        try:
            save_button = await page.wait_for_selector(
                "#js_submit button",
                timeout=10000
            )
            
            print("找到保存按钮，准备点击...")
            await save_button.click()
            
            await asyncio.sleep(3)
            
            try:
                success_msg = await page.wait_for_selector(
                    ".weui-desktop-toast__content:has-text('保存成功')",
                    timeout=5000
                )
                print("✓ 文章已保存为草稿！")
            except:
                print("✓ 保存命令已执行")
                
        except Exception as e:
            print(f"❌ 保存草稿失败: {e}")
            raise
    
    async def process_single_article(self, markdown_file, title=None, author="自动发布"):
        """
        处理单个 markdown 文件
        
        Args:
            markdown_file: markdown 文件路径
            title: 文章标题（如果为None，从文件名生成）
            author: 作者名称
        """
        try:
            # 生成标题（如果未提供）
            if title is None:
                title = Path(markdown_file).stem.replace('-', ' ').replace('_', ' ').title()
                
            print(f"\n{'='*60}")
            print(f"📝 开始处理文章: {Path(markdown_file).name}")
            print(f"📄 标题: {title}")
            print(f"👤 作者: {author}")
            print(f"{'='*60}")
            
            # 1. 读取 markdown 文件
            print(f"\n正在读取 Markdown 文件: {markdown_file}")
            markdown_content = self.read_markdown_file(markdown_file)
            if not markdown_content:
                print("❌ 无法读取 Markdown 文件")
                return False
            print(f"✓ 文件读取成功，内容长度: {len(markdown_content)} 字符")
            
            # 2. 转换 markdown 为富文本并复制
            success = await self.convert_markdown_to_richtext(markdown_content)
            if not success:
                print("❌ Markdown 转换失败")
                return False
                
            # 3. 点击文章按钮（创建新文章）
            await self.click_article_button()
            
            # 4. 填写文章内容
            await self.fill_article_with_paste(title, author)
            
            # 5. 保存为草稿
            await self.save_as_draft()
            
            print(f"\n✅ 文章 '{title}' 处理完成！")
            return True
            
        except Exception as e:
            print(f"\n❌ 处理文章失败: {e}")
            import traceback
            traceback.print_exc()
            return False
            
    async def run_batch(self):
        """
        批量处理所有 markdown 文件
        """
        try:
            # 1. 启动浏览器
            await self.start()
            
            # 2. 获取所有 markdown 文件
            md_files = self.get_markdown_files()
            if not md_files:
                print("❌ posts 文件夹中没有找到 Markdown 文件")
                return
            
            print(f"\n🚀 准备批量处理 {len(md_files)} 个文件:")
            for i, file in enumerate(md_files, 1):
                print(f"  {i}. {file.name}")
            
            # 3. 登录微信公众号（只需要登录一次）
            await self.login_wechat()
            
            # 4. 逐个处理每个文件
            successful_count = 0
            failed_files = []
            
            for i, md_file in enumerate(md_files, 1):
                print(f"\n🔄 处理进度: {i}/{len(md_files)}")
                
                try:
                    # 处理单个文章
                    success = await self.process_single_article(md_file)
                    
                    if success:
                        # 成功后移动文件到 done 目录
                        if self.move_to_done(md_file):
                            successful_count += 1
                            print(f"✅ 第 {i} 篇文章处理完成并已归档")
                        else:
                            print(f"⚠️ 第 {i} 篇文章处理成功但归档失败")
                            successful_count += 1
                    else:
                        failed_files.append(md_file.name)
                        print(f"❌ 第 {i} 篇文章处理失败")
                        
                    # 文章间等待一下，避免操作过快
                    if i < len(md_files):
                        print("⏳ 等待 3 秒后处理下一篇文章...")
                        await asyncio.sleep(3)
                        
                except Exception as e:
                    print(f"❌ 处理文件 {md_file.name} 时出错: {e}")
                    failed_files.append(md_file.name)
                    continue
            
            # 5. 显示最终结果
            print(f"\n{'='*60}")
            print("📊 批量处理结果统计")
            print(f"{'='*60}")
            print(f"✅ 成功处理: {successful_count} 篇")
            print(f"❌ 失败文件: {len(failed_files)} 篇")
            
            if failed_files:
                print(f"\n失败的文件列表:")
                for file in failed_files:
                    print(f"  - {file}")
                print("\n💡 建议检查这些文件的内容和格式")
            
            if successful_count > 0:
                print(f"\n🎉 已成功将 {successful_count} 篇文章保存到微信公众号草稿箱！")
                print(f"📁 处理完成的文件已移动到 done/ 目录")
            
            print(f"\n{'='*60}")
            
            # 等待用户查看结果
            print("\n浏览器将在15秒后关闭...")
            await asyncio.sleep(15)
            
        except Exception as e:
            print(f"\n❌ 批量处理过程中出现错误: {e}")
            import traceback
            traceback.print_exc()
            print("浏览器将在30秒后关闭，请检查...")
            await asyncio.sleep(30)
            
        finally:
            # 关闭浏览器
            if self.browser:
                await self.browser.close()
                print("浏览器已关闭")
            
    async def run(self, markdown_file, title, author):
        """
        执行完整的自动化流程
        
        Args:
            markdown_file: markdown 文件路径
            title: 文章标题
            author: 作者名称
        """
        try:
            # 1. 启动浏览器
            await self.start()
            
            # 2. 读取 markdown 文件
            print(f"\n正在读取 Markdown 文件: {markdown_file}")
            markdown_content = self.read_markdown_file(markdown_file)
            if not markdown_content:
                print("❌ 无法读取 Markdown 文件")
                return
            print(f"✓ 文件读取成功，内容长度: {len(markdown_content)} 字符")
            
            # 3. 转换 markdown 为富文本并复制
            success = await self.convert_markdown_to_richtext(markdown_content)
            if not success:
                print("❌ Markdown 转换失败")
                return
                
            # 4. 登录微信公众号
            await self.login_wechat()
            
            # 5. 点击文章按钮
            await self.click_article_button()
            
            # 6. 填写文章内容（标题、粘贴正文、作者）
            await self.fill_article_with_paste(title, author)
            
            # 7. 保存为草稿
            await self.save_as_draft()
            
            print("\n" + "="*50)
            print("✓ 所有操作已完成！")
            print("="*50)
            
            # 等待用户查看结果
            print("\n浏览器将在15秒后关闭...")
            await asyncio.sleep(15)
            
        except Exception as e:
            print(f"\n❌ 执行过程中出现错误: {e}")
            import traceback
            traceback.print_exc()
            print("浏览器将在30秒后关闭，请检查...")
            await asyncio.sleep(30)
            
        finally:
            # 关闭浏览器
            if self.browser:
                await self.browser.close()
                print("浏览器已关闭")


async def main():
    """
    主函数 - 批量处理所有 markdown 文件
    """
    automation = MarkdownToWeChatAutomation()
    
    # 确保目录存在
    automation.ensure_directories()
    
    # 获取所有 markdown 文件
    md_files = automation.get_markdown_files()
    
    if not md_files:
        print("="*60)
        print("❌ posts 文件夹中没有找到 Markdown 文件")
        print("="*60)
        print(f"\n请在 {automation.posts_dir.absolute()} 文件夹中放置 .md 文件")
        print("\n示例：posts/my-article.md")
        print("\n创建示例文件命令:")
        print("  echo '# 我的文章\\n\\n这是内容...' > posts/example.md")
        return
    
    print("="*60)
    print("🚀 Markdown 文章批量发布到微信公众号")
    print("="*60)
    print(f"\n📁 找到 {len(md_files)} 个 Markdown 文件:")
    for i, file in enumerate(md_files, 1):
        file_size = file.stat().st_size
        print(f"  {i:2d}. {file.name:<30} ({file_size:,} bytes)")
    
    print(f"\n📋 处理计划:")
    print(f"  • 登录微信公众号后台")
    print(f"  • 逐个转换并发布 {len(md_files)} 篇文章")
    print(f"  • 自动保存为草稿")
    print(f"  • 处理完成的文件移动到 done/ 目录")
    print(f"\n⚠️  注意事项:")
    print(f"  • 请确保网络连接稳定")
    print(f"  • 整个过程可能需要 {len(md_files) * 2} - {len(md_files) * 3} 分钟")
    print(f"  • 请准备好微信扫码登录")
    
    print(f"\n" + "="*60)
    input("按回车键开始批量处理...")
    
    # 执行批量自动化流程
    await automation.run_batch()


async def main_single():
    """
    单文件处理模式（保留用于测试）
    """
    automation = MarkdownToWeChatAutomation()
    
    # 获取所有 markdown 文件
    md_files = automation.get_markdown_files()
    
    if not md_files:
        print("❌ 没有找到 Markdown 文件")
        return
    
    selected_file = md_files[0]
    default_title = selected_file.stem.replace('-', ' ').replace('_', ' ').title()
    
    # 执行单文件流程（旧版本兼容）
    await automation.run(
        markdown_file=selected_file,
        title=default_title,
        author="芝士AI吃鱼"
    )


if __name__ == "__main__":
    asyncio.run(main())
