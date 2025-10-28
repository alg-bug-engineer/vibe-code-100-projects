#!/usr/bin/env python3
"""
publish_csdn.py

基于 Playwright 的自动化脚本：将本地 Markdown 文件发布到 CSDN 编辑器页面。

支持 YAML Front Matter (--- ... ---) 提取 title 和 tags。
如果 Front Matter 不存在或缺少字段，则回退到解析 ```toc``` 代码块。

注意：脚本不会替你登录。脚本会打开编辑页面并等待你在浏览器中完成登录（默认 2 分钟），登录后会自动填充标题与正文并触发发布。

用法示例:
  python3 publish_csdn.py path/to/post.md --title "文章标题" --headless false

建议先执行:
  pip install -r requirements.txt
  pip install python-frontmatter  # 新增依赖
  playwright install

"""
from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeoutError, Error as PlaywrightError
import pyperclip
import argparse
import sys
import time
from pathlib import Path
import re  # 导入 re (原始脚本中已在函数内导入，这里统一到顶部)
import frontmatter # 新增：用于解析 YAML Front Matter


EDITOR_URL = "https://editor.csdn.net/md/?not_checkout=1&spm=1000.2115.3001.5352"


def read_markdown(path: Path) -> str:
    if not path.exists():
        raise FileNotFoundError(f"Markdown file not found: {path}")
    return path.read_text(encoding="utf-8")

def fill_title(page, title: str) -> bool:
    """尝试多个可能的标题选择器，返回是否成功填充"""
    title_selectors = [
        'input[placeholder*="标题"]',
        'input[placeholder*="文章标题"]',
        'input.title',
        'input#title',
        'input[name="title"]',
    ]
    for sel in title_selectors:
        el = page.query_selector(sel)
        if el:
            try:
                el.fill(title)
                print(f"已填充标题 (selector={sel})")
                return True
            except Exception:
                continue
    print("未找到标题输入框，跳过标题填充（你可以在打开页面后手动填写）")
    return False


def fill_editor_with_markdown(page, md: str) -> bool:
    """向内容可编辑区域写入 markdown 文本。返回是否成功。"""
    # 首选精确选择器（来自用户提供信息）
    selectors = [
        'pre.editor__inner.markdown-highlighting[contenteditable="true"]',
        'pre.editor__inner[contenteditable="true"]',
        'div[contenteditable="true"]',
    ]
    # 尝试通过编辑器 API 写入（如果存在）
    try:
        got = page.evaluate("(text) => {\n            try{\n                const cm = document.querySelector('.CodeMirror');\n                if(cm && cm.CodeMirror){ cm.CodeMirror.setValue(text); return true; }\n                if(window.CodeMirror && window.CodeMirror.runMode){ /* best effort */ }\n                if(window.monaco && window.monaco.editor){ try{ const eds = window.monaco.editor.getModels(); if(eds && eds[0]){ const editors = window.monaco.editor.getEditors ? window.monaco.editor.getEditors() : null; if(editors && editors[0]){ editors[0].setValue(text); return true; } } }catch(e){} }\n            }catch(e){}\n            return false;\n        }", md)
        if got:
            print("已通过编辑器 API 写入内容")
            return True
    except Exception:
        pass

    # JS 写入：使用 textContent 并触发 paste 事件（尽量保留原始换行）
    for sel in selectors:
        try:
            el = page.query_selector(sel)
            if not el:
                continue
            try:
                page.eval_on_selector(sel, '(el, value) => { el.focus(); try{ el.textContent = value; }catch(e){}; try{ const dt = new DataTransfer(); dt.setData("text/plain", value); const evt = new ClipboardEvent("paste", { clipboardData: dt, bubbles: true }); el.dispatchEvent(evt); }catch(e){}; el.dispatchEvent(new Event("input", { bubbles: true })); }', md)
                print(f"已在编辑器中写入内容 (selector={sel})")
                return True
            except Exception as e:
                print(f"通过 JS 写入选择器 {sel} 失败: {e}")
                continue
        except Exception as e:
            print(f"尝试使用选择器 {sel} 写入失败: {e}")
            continue

    print("未找到可写入的编辑器元素，请检查页面是否已正确加载并已登录")

    try:
        pyperclip.copy(md)
    except Exception as e:
        print(f"将内容复制到系统剪贴板失败: {e}")
        return False

    paste_selectors = [
        'div.editor div.cledit-section',
        'div.cledit-section',
        'pre.editor__inner.markdown-highlighting[contenteditable="true"]',
        'div[contenteditable="true"]',
    ]
    for sel in paste_selectors:
        try:
            locator = page.locator(sel).first
            locator.wait_for(state="visible", timeout=5000)
            locator.click()
            # 模拟系统粘贴 (Mac 使用 Meta, 其他使用 Control)
            mod = 'Meta' if sys.platform == 'darwin' else 'Control'
            page.keyboard.press(f"{mod}+v")
            time.sleep(0.5)
            print(f"已通过剪贴板粘贴到编辑器 (selector={sel})")
            return True
        except Exception as e:
            # 尝试下一个选择器
            print(f"尝试通过剪贴板粘贴到选择器 {sel} 失败: {e}")
            continue

    print("尝试剪贴板粘贴也失败，可能需要手动粘贴或进一步调整选择器")
    return False


def click_publish_buttons(page, tags=None) -> bool:
    """点击发布按钮并在弹出的确认框中点击最终发布按钮。返回是否成功。"""
    def robust_click(selector, desc, timeout=10000, retries=2):
        locator = page.locator(selector).first
        try:
            locator.wait_for(state="visible", timeout=timeout)
        except PlaywrightTimeoutError:
            print(f"等待元素可见超时: {selector} ({desc})")
            return False

        last_err = None
        for attempt in range(1, retries + 1):
            try:
                # 将元素滚动到视图并尝试点击
                locator.scroll_into_view_if_needed()
                locator.click(timeout=5000)
                print(f"已点击 {desc} (selector={selector}, attempt={attempt})")
                return True
            except PlaywrightError as e:
                last_err = e
                print(f"尝试点击 {desc} 失败 (attempt={attempt}): {e}")
                try:
                    # 尝试强制点击一次
                    locator.click(force=True, timeout=3000)
                    print(f"已强制点击 {desc} (selector={selector}, attempt={attempt})")
                    return True
                except PlaywrightError as e2:
                    last_err = e2
                    print(f"强制点击也失败: {e2}")
                    time.sleep(0.5)

        # JS fallback: 尝试使用原生 DOM click
        try:
            page.evaluate("(s) => { const el = document.querySelector(s); if(el){ el.scrollIntoView(); el.click(); return true;} return false; }", selector)
            print(f"已使用 JS fallback 点击 {desc} (selector={selector})")
            return True
        except Exception as e:
            print(f"JS fallback 点击 {desc} 失败: {e} (last_err={last_err})")
            return False

    # 主发布按钮
    publish_selectors = [
        'button.btn.btn-publish',
        'button.btn-publish',
        'button[role="button"][data-report-click]'
    ]
    clicked = False
    for sel in publish_selectors:
        if robust_click(sel, '主发布按钮', timeout=20000, retries=3):
            clicked = True
            break

    if not clicked:
        print("未能找到或点击主发布按钮，可能页面结构已变化或元素被遮挡")
        return False

    # 确认弹窗中的发布按钮
    # 等待弹窗出现（短暂），然后尝试按文字或 modal 范围查找按钮
    time.sleep(0.5)

    def robust_click_by_text(button_text, desc, timeout=10000, retries=3):
        last_err = None
        for attempt in range(1, retries + 1):
            try:
                # 优先使用 role-based 查找
                locator = page.get_by_role("button", name=button_text).first
                locator.wait_for(state="visible", timeout=timeout)
                locator.scroll_into_view_if_needed()
                locator.click(timeout=5000)
                print(f"已点击 {desc} (by role/name='{button_text}', attempt={attempt})")
                return True
            except Exception as e:
                last_err = e
                print(f"尝试按文本查找并点击 {desc} 失败 (attempt={attempt}): {e}")
                # fallback 使用 has-text 选择器
                try:
                    locator2 = page.locator(f'button:has-text("{button_text}")').first
                    locator2.wait_for(state="visible", timeout=2000)
                    locator2.scroll_into_view_if_needed()
                    locator2.click(timeout=3000)
                    print(f"已点击 {desc} (button:has-text('{button_text}'), attempt={attempt})")
                    return True
                except Exception as e2:
                    last_err = e2
                    print(f"has-text fallback 失败: {e2}")

            time.sleep(0.5)

        # 尝试在常见 modal 容器中查找
        modal_containers = ['.modal__button-bar', '.modal', '.el-dialog__footer', '.dialog-footer']
        for container in modal_containers:
            try:
                locator3 = page.locator(f'{container} >> button:has-text("{button_text}")').first
                locator3.wait_for(state="visible", timeout=3000)
                locator3.scroll_into_view_if_needed()
                locator3.click()
                print(f"已在容器 {container} 中点击 {desc} (text='{button_text}')")
                return True
            except Exception as e:
                last_err = e
                # continue

        # JS fallback: 根据按钮文本遍历所有 button 并点击第一个匹配项
        try:
            clicked = page.evaluate("(t) => { const btns = Array.from(document.querySelectorAll('button')); for (const b of btns){ if(b.innerText && b.innerText.trim().includes(t)){ b.scrollIntoView(); b.click(); return true; } } return false; }", button_text)
            if clicked:
                print(f"已使用 JS 文本回退点击 {desc} (text='{button_text}')")
                return True
        except Exception as e:
            last_err = e
            print(f"JS 文本回退出错: {e}")

        print(f"最终未能点击 {desc} (text='{button_text}'), last_err={last_err}")
        return False

    # 优先在 modal 区域内查找并点击最终的发布按钮，然后等待 modal 关闭
    modal_containers = ['.modal__inner-2', '.modal__content', '.modal__button-bar', '.el-dialog__wrapper']
    clicked_confirm = False

    def ensure_tags_in_modal(page, container_selector, tag_text='人工智能'):
        """如果 modal 中没有 tags，则尝试触发下拉并输入 tag_text 然后回车添加。"""
        try:
            # 优先在 mark_selection_box 查找已有标签
            tags_locator = page.locator(f'{container_selector} .mark_selection_box .el-tag')
            try:
                if tags_locator.count() > 0:
                    print("弹窗中已有标签，跳过添加标签步骤")
                    return True
            except Exception:
                # 如果 count 不可用，尝试通过存在 mark_selection_box 判断
                if page.locator(f'{container_selector} .mark_selection_box').count() > 0:
                    # 继续尝试添加（可能没有已选标签）
                    pass

            # 触发下拉/显示输入框：根据你提供的 DOM，输入框在 .mark_selection_box 内
            trigger_selectors = [
                f'{container_selector} .mark_selection_box',
                f'{container_selector} .mark_selection .tag__btn-tag',
                f'{container_selector} .mark-mask-box-div',
            ]
            input_selector_candidates = [
                f'{container_selector} .mark_selection_box input.el-input__inner',
                f'{container_selector} input.el-input__inner',
                'input.el-input__inner',
            ]

            for trig in trigger_selectors:
                try:
                    trg = page.locator(trig).first
                    trg.wait_for(state='visible', timeout=2000)
                    trg.scroll_into_view_if_needed()
                    # 优先 hover，然后 click，尽量触发下拉
                    try:
                        trg.hover()
                    except Exception:
                        try:
                            trg.click()
                        except Exception:
                            pass

                    # 等待并填写输入框
                    for inp in input_selector_candidates:
                        try:
                            iloc = page.locator(inp).first
                            iloc.wait_for(state='visible', timeout=2000)
                            iloc.click()
                            # 使用 keyboard.type 更接近人工输入以触发下拉建议
                            page.keyboard.type(tag_text)
                            page.keyboard.press('Enter')
                            time.sleep(0.5)
                            # 检查是否添加成功
                            new_count = page.locator(f'{container_selector} .mark_selection_box .el-tag').count()
                            if new_count > 0:
                                print(f"在弹窗中已添加标签: {tag_text}")
                                # 点击弹窗的空白处以关闭下拉/输入提示（更精确的策略，避免点到下拉本身）
                                try:
                                    # 1) 尝试点击 modal header 的中心（通常在 .modal__content h3）
                                    try:
                                        header_loc = page.locator(f'{container_selector} h3').first
                                        if header_loc and header_loc.is_visible():
                                            box = header_loc.bounding_box()
                                            if box:
                                                cx = box['x'] + box['width'] / 2
                                                cy = box['y'] + box['height'] / 2
                                                page.mouse.move(cx, cy)
                                                page.mouse.click(cx, cy)
                                                print(f"已点击 {container_selector} 内 header 中心以关闭下拉")
                                            else:
                                                # header 存在但没有 bounding_box，回退到 locator.click
                                                header_loc.click(timeout=1000)
                                                print(f"已通过 locator 点击 {container_selector} 的 header")
                                        else:
                                            raise Exception('header not visible')
                                    except Exception:
                                        # 2) 点击容器的右上偏移处（避免下拉在左侧遮挡）
                                        try:
                                            cont = page.locator(container_selector).first
                                            box = cont.bounding_box()
                                            if box:
                                                # 在容器的右上角向内偏移 16px, 16px
                                                cx = box['x'] + box['width'] - 16
                                                cy = box['y'] + 16
                                                page.mouse.move(cx, cy)
                                                page.mouse.click(cx, cy)
                                                print(f"已点击容器 {container_selector} 的右上偏移处以关闭下拉")
                                            else:
                                                # fallback: 简单 locator.click
                                                cont.click(timeout=1000)
                                                print(f"已通过 locator 点击容器 {container_selector}")
                                        except Exception:
                                            # 3) JS fallback：在容器内部左上角调度一个 click 事件
                                            try:
                                                page.evaluate("(s)=>{ const el=document.querySelector(s); if(!el) return false; const r=el.getBoundingClientRect(); const x=r.left+8; const y=r.top+8; el.dispatchEvent(new MouseEvent('click',{bubbles:true,clientX:x,clientY:y})); return true; }", container_selector)
                                                print(f"已使用 JS 点击容器 {container_selector} 的空白处以关闭下拉")
                                            except Exception as e_js:
                                                print(f"JS 点击容器空白处失败: {e_js}")
                                except Exception as e:
                                    print(f"点击弹窗空白区域失败: {e}")

                                # 等短暂时间让下拉关闭
                                time.sleep(0.2)
                                return True
                        except Exception:
                            continue
                except Exception:
                    continue

            print("尝试在弹窗中添加标签失败")
            return False
        except Exception as e:
            print(f"ensure_tags_in_modal 出错: {e}")
            return False
            
    for container in modal_containers:
        try:
            # 在容器内查找带红色类或文本的按钮
            # 在尝试点击发布前，确保弹窗中有标签（否则添加默认标签）
            try:
                # 优先使用传入的 tags（来自 toc），逐个添加
                if tags and isinstance(tags, (list, tuple)) and len(tags) > 0:
                    print(f"尝试在弹窗中添加 {len(tags)} 个标签: {tags}")
                    for t in tags:
                        try:
                            ensure_tags_in_modal(page, container_selector=container, tag_text=t)
                        except Exception:
                            # 某个 tag 添加失败时继续下一个
                            print(f"添加标签 {t} 失败，继续...")
                            pass
                else:
                    try:
                        print("未提供标签，尝试添加默认标签 '人工智能'")
                        ensure_tags_in_modal(page, container_selector=container, tag_text='人工智能')
                    except Exception:
                        pass
            except Exception as e_tag:
                print(f"添加标签时出错: {e_tag}")

            btn_locator = page.locator(f'{container} >> button.btn-b-red:visible').first
            if btn_locator:
                try:
                    btn_locator.wait_for(state='visible', timeout=5000)
                    btn_locator.scroll_into_view_if_needed()
                    btn_locator.click(timeout=5000)
                    print(f"已在容器 {container} 内点击发布按钮")
                    # 等待 modal 被移除
                    try:
                        page.wait_for_selector(container, state='detached', timeout=10000)
                        print(f"容器 {container} 已关闭")
                    except Exception:
                        # 如果容器没有按预期关闭，短暂等待以确保发布请求发出
                        time.sleep(1)
                    clicked_confirm = True
                    break
                except Exception as e:
                    print(f"在容器 {container} 内点击发布失败: {e}")
        except Exception:
            # 容器选择器不存在或不可见
            continue

    if not clicked_confirm:
        # 除了 container 内查找之外，也尝试按文本/role 查找（已有的文本查找回退）
        clicked_confirm = robust_click_by_text('发布文章', '确认发布按钮', timeout=15000, retries=3)

    if not clicked_confirm:
        print("未能找到或点击确认发布按钮，发布可能没有完成。请手动检查页面。")
        return False

    return True


def main():
    parser = argparse.ArgumentParser(description="将 posts 目录下的 Markdown 发布到 CSDN 编辑器（基于 Playwright）。")
    parser.add_argument("--headless", default="false", choices=["true", "false"], help="是否无头模式，默认 false（显示浏览器以便登录）")
    parser.add_argument("--login-timeout", type=int, default=120, help="等待登录时间（秒），默认 120 秒")
    parser.add_argument("--skip-publish", action='store_true', help="只填充标题与正文但不触发发布（调试用）")
    # 移除了 --title 和 --file 参数，因为脚本现在是处理 'posts' 目录
    args = parser.parse_args()

    posts_dir = Path('posts')
    if not posts_dir.exists() or not posts_dir.is_dir():
        print("未找到 posts 目录，请在当前路径创建一个名为 'posts' 的文件夹并放入 .md 文件")
        sys.exit(2)

    files_to_process = [p for p in sorted(posts_dir.glob('*.md'))]
    if not files_to_process:
        print("posts 目录下未找到任何 .md 文件，退出")
        sys.exit(0)

    headless = True if args.headless.lower() == "true" else False

    # 固定 storage.json：不存在则保存，存在则加载
    storage_file = Path('storage.json')

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=headless)

        # 如果 storage 存在则加载以复用登录状态
        if storage_file.exists():
            print(f"加载 storage state: {storage_file}")
            context = browser.new_context(storage_state=str(storage_file))
            page = context.new_page()
        else:
            context = browser.new_context()
            page = context.new_page()

        print(f"打开编辑页面：{EDITOR_URL}")
        page.goto(EDITOR_URL, timeout=60000)

        # 如果没有 storage，则等待用户登录并保存 storage
        if not storage_file.exists():
            print(f"等待最多 {args.login_timeout} 秒以完成登录并加载编辑器... 如果尚未登录，请在浏览器中完成登录。")
            try:
                editor_selector = 'pre.editor__inner.markdown-highlighting[contenteditable="true"]'
                page.wait_for_selector(editor_selector, timeout=args.login_timeout * 1000)
                # 保存 storage
                try:
                    context.storage_state(path=str(storage_file))
                    print(f"已保存 login storage 到: {storage_file}")
                except Exception as e:
                    print(f"保存 storage_state 失败: {e}")
            except PlaywrightTimeoutError:
                print("等待编辑器元素超时，尝试继续（可能需要你手动登录或手动打开编辑器）")
        
        # 循环处理 files_to_process
        for idx, fp in enumerate(files_to_process, start=1):
            print(f"\n===== 处理 {idx}/{len(files_to_process)}: {fp} =====")
            try:
                # 1. 读取完整 MD 文本
                full_md_text = read_markdown(fp)
            except Exception as e:
                print(f"读取 {fp} 失败: {e}, 跳过")
                continue

            # 4. 确定最终的 title 和 tags
            use_title = fp.stem
            
            print(f"使用标题: {use_title}")
            print(f"使用标签: 人工智能")

            # 填充编辑器页面：确保在编辑器页面
            try:
                page.goto(EDITOR_URL, timeout=60000)
            except Exception as e:
                print(f"跳转到编辑器失败: {e}")

            # 尝试填标题
            if use_title:
                fill_title(page, use_title)

            # 5. 填充正文 (使用不含 YAML 的 md_content_to_publish)
            post = frontmatter.loads(full_md_text)
            ok = fill_editor_with_markdown(page, post.content)
            if not ok:
                print("未能自动填充正文，跳过自动发布。你可以手动粘贴后再运行脚本的发布步骤")
                continue

            time.sleep(2)

            if args.skip_publish:
                print("--skip-publish 启用，已填充但未触发发布。")
                continue

            # 6. 点击发布 (传入最终的 use_tags)
            use_tags = ["人工智能"]
            published = click_publish_buttons(page, tags=use_tags)
            if published:
                print(f"已触发发布请求: {fp}")
            else:
                print(f"{fp} 的发布步骤未完全成功，请手动检查页面。")

            # 每次发布后给短暂等待，避免触发平台防护，得至少 30 秒
            time.sleep(30)

    # with sync_playwright 上下文退出时 Playwright 会负责清理，
    # 避免在 with 之外再次调用 browser.close() 导致 "Event loop is closed" 错误。


if __name__ == '__main__':
    main()