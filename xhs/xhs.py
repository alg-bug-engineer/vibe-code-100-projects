import time
import os
from pathlib import Path
from datetime import datetime
from playwright.sync_api import sync_playwright, Playwright, expect

# 状态文件的保存路径
STORAGE_STATE_FILE = "xiaohongshu_auth.json"
# 目标网页
TARGET_URL = "https://www.xiaohongshu.com/explore"

# 关键选择器
# 1. 登录弹窗
LOGIN_DIALOG_SELECTOR = '[role="dialog"]:has-text("扫码登录")'
# 2. 登录成功后的用户头像
LOGGED_IN_AVATAR_SELECTOR = 'a.avator-wrap'


def is_logged_in(page, context, avatar_locator=None):
    """多策略判断是否已登录。
    返回 (bool, method)——method 表示触发登录判定的策略。
    优先级：头像元素 -> 常见 DOM 选择器 -> localStorage keys -> cookies -> URL。
    """
    try:
        # 1) 优先使用头像元素（如果传入了 locator）
        if avatar_locator is not None:
            try:
                if avatar_locator.is_visible():
                    return True, "avatar"
            except Exception:
                # ignore and continue
                pass

        # 2) 常见的 DOM 指示器（可能因页面版本不同而变化）
        try:
            # 查找可能的用户链接（例如 /user/ 开头的 href）
            has_user_link = page.evaluate("Boolean(document.querySelector('a[href*=" + '"/user/"' + "]'))")
        except Exception:
            has_user_link = False

        if has_user_link:
            return True, "user_link"

        # 3) 检查 localStorage 中是否存在 token/user 字样的 key
        try:
            ls_keys = page.evaluate("Object.keys(window.localStorage || {})") or []
            for k in ls_keys:
                kl = str(k).lower()
                if any(substr in kl for substr in ("token", "login", "user", "auth", "session")):
                    return True, f"localStorage:{k}"
        except Exception:
            pass

        # 4) 检查 cookies 中是否有可疑的登录 cookie
        try:
            cookies = context.cookies()
            for c in cookies:
                name = c.get("name", "").lower()
                if any(substr in name for substr in ("token", "session", "auth", "xhs")):
                    return True, f"cookie:{name}"
        except Exception:
            pass

        # 5) 最后检查 URL 是否包含用户相关路径
        try:
            url = page.url or ""
            if any(p in url for p in ("/user/", "/people", "profile", "mypage")):
                return True, f"url:{url}"
        except Exception:
            pass

    except Exception:
        # 防守性兜底：任何内部错误都作为未登录处理
        return False, None

    return False, None

def run(playwright: Playwright):
    browser = playwright.chromium.launch(headless=False)
    context = None
    
    # 1. 检查是否存在已保存的登录状态
    if os.path.exists(STORAGE_STATE_FILE):
        print(f"检测到登录文件 {STORAGE_STATE_FILE}，正在尝试加载...")
        try:
            context = browser.new_context(storage_state=STORAGE_STATE_FILE)
        except Exception as e:
            print(f"加载状态文件失败 (文件可能已损坏): {e}")
            context = None # 加载失败，重置 context
    
    if not context:
        print("未找到有效登录文件，将创建新会话。")
        context = browser.new_context()

    page = context.new_page()
    
    try:
        print(f"正在打开: {TARGET_URL}")
        page.goto(TARGET_URL)

        # -----------------------------------------------------------------
        # 核心逻辑：等待页面加载完成，并判断状态
        # -----------------------------------------------------------------
        
        print("正在等待页面加载并判断登录状态...")

        # 定义两个关键元素
        dialog_locator = page.locator(LOGIN_DIALOG_SELECTOR)
        avatar_locator = page.locator(LOGGED_IN_AVATAR_SELECTOR)

        # 首次短等待，看到弹窗或头像任意一个出现即可进入后续更长等待/轮询
        try:
            expect(dialog_locator.or_(avatar_locator)).to_be_visible(timeout=15000)
            print("检测到登录弹窗或用户头像，进入确认流程。")
        except Exception:
            print("初始等待未检测到登录弹窗或用户头像，继续轮询（最长 2 分钟）...")

        # 更稳健的等待：优先使用 wait_for_selector，失败后采用有限轮询防止无限挂起
        MAX_LOGIN_WAIT = 120  # seconds
        POLL_INTERVAL = 1     # seconds
        logged_in = False

        # 先尝试通过快速 is_logged_in 检查（优先使用头像，但支持多种策略）
        quick_ok, method = is_logged_in(page, context, avatar_locator=avatar_locator)
        if quick_ok:
            logged_in = True
            print(f"检测到已登录（快速检查，方法={method}），登录已确认。")
        else:
            # 快速等待没有命中，进入更稳健的轮询
            print("初始快速等待未检测到登录，进入轮询流程（最长 {}s）...".format(MAX_LOGIN_WAIT))

        start = time.time()
        last_dialog_visible = None
        while time.time() - start < MAX_LOGIN_WAIT:
            try:
                avatar_visible = False
                dialog_visible = False

                # 使用多策略判断登录状态
                try:
                    ok, method = is_logged_in(page, context, avatar_locator=avatar_locator)
                except Exception:
                    ok, method = False, None

                if ok:
                    logged_in = True
                    print(f"检测到已登录（方法={method}），登录已确认。")
                    break

                # 仍未登录，继续检查弹窗状态用于提示
                try:
                    dialog_visible = dialog_locator.is_visible()
                except Exception:
                    dialog_visible = False

                # 打印状态变化，避免每秒刷屏
                if dialog_visible:
                    if last_dialog_visible is not True:
                        print("检测到登录弹窗，等待用户扫码...")
                    # 继续等待
                else:
                    if last_dialog_visible is not False:
                        # 弹窗刚刚消失，抓取一次中间截图与 DOM 用于诊断
                        print("弹窗已消失，短时间等待头像出现；正在保存中间调试信息...")
                        logs_dir = Path("logs")
                        logs_dir.mkdir(exist_ok=True)
                        ts = datetime.now().strftime("%Y%m%d_%H%M%S")
                        mid_screenshot = logs_dir / f"xhs_mid_after_dialog_{ts}.png"
                        mid_html = logs_dir / f"xhs_mid_after_dialog_{ts}.html"
                        try:
                            page.screenshot(path=str(mid_screenshot), full_page=True)
                            page_content = page.content()
                            with open(mid_html, "w", encoding="utf-8") as f:
                                f.write(page_content)
                            print(f"已保存中间截图: {mid_screenshot} 和 DOM 到: {mid_html}")
                        except Exception as e:
                            print(f"保存中间调试信息失败: {e}")
                    else:
                        # 继续等待，简短提示
                        print("弹窗已消失，等待头像（缓冲中）...")

                last_dialog_visible = dialog_visible

            except KeyboardInterrupt:
                print("检测到中断 (KeyboardInterrupt)，正在优雅退出...")
                break
            except Exception as e:
                print(f"轮询检测出错（忽略并继续）: {e}")

            time.sleep(POLL_INTERVAL)

        if not logged_in:
            # 保存调试截图与页面内容，便于排查
            logs_dir = Path("logs")
            logs_dir.mkdir(exist_ok=True)
            ts = datetime.now().strftime("%Y%m%d_%H%M%S")
            screenshot_path = logs_dir / f"xhs_login_timeout_{ts}.png"
            try:
                page.screenshot(path=str(screenshot_path), full_page=True)
                print(f"登录超时，已保存截图到: {screenshot_path}")
            except Exception as e:
                print(f"保存截图失败: {e}")

            print("登录未完成，脚本退出。")
            try:
                browser.close()
            except Exception:
                pass
            return

        # 到这里确认已登录，保存状态
        print(f"正在保存登录状态到 {STORAGE_STATE_FILE}...")
        # 稍微等待一下，确保 cookies/localStorage 完全写入
        time.sleep(2)
        try:
            context.storage_state(path=STORAGE_STATE_FILE)
            print("登录状态已保存，下次将自动登录。")
        except Exception as e:
            print(f"保存登录状态失败: {e}")

        # 此时应该已登录
        print(f"\n成功打开页面: {page.title()}")
        print("浏览器将保持打开 15 秒钟...")
        # 在保存状态并短暂停留后，进行浏览与互动
        time.sleep(1)
        try:
            browse_and_engage(page, max_items=8, wait_seconds=4)
        except Exception as e:
            print(f"浏览与互动发生错误: {e}")

        print("浏览完成，浏览器将保持打开 10 秒钟...")
        time.sleep(10)

    except KeyboardInterrupt:
        print("脚本被用户中断 (KeyboardInterrupt)。")
    except Exception as e:
        print(f"脚本执行出错: {e}")
    finally:
        print("脚本运行结束，尝试关闭浏览器/上下文。")
        try:
            context.close()
        except Exception:
            pass
        try:
            browser.close()
        except Exception:
            pass


def browse_and_engage(page, max_items=5, wait_seconds=4):
    """在探索页依次打开帖子、停留、点击 like & collect、关闭并继续。
    - max_items: 最多处理的帖子数量
    - wait_seconds: 在详情页停留的秒数（页面提示的 4s 可由此控制）
    """
    print(f"开始浏览并互动（最多 {max_items} 条）...")

    # --- 定义一个健壮的、带日志的点击辅助函数 ---
    def robust_click(candidates, action_name="Button"):
        """
        尝试多个选择器和多种点击方法（普通、强制、JS）。
        在 page 上下文中执行。
        """
        for sel in candidates:
            try:
                loc = page.locator(sel)
                count = loc.count()
                if count == 0:
                    print(f"  [Click] {action_name}: Selector '{sel}' not found (count=0).")
                    continue
                
                print(f"  [Click] {action_name}: Found {count} element(s) for '{sel}'. Trying first...")

                # 1. 尝试 Hover + Click (最接近用户行为)
                try:
                    loc.first.hover(timeout=1000)
                    loc.first.click(timeout=2000)
                    print(f"  [Click] {action_name}: SUCCESS (Hover+Click) on '{sel}'")
                    return True, sel
                except Exception as e_click:
                    # 打印简洁的错误信息
                    error_msg = str(e_click).splitlines()[0]
                    print(f"  [Click] {action_name}: Hover+Click failed for '{sel}': {error_msg}")

                # 2. 尝试 Force Click (跳过可见性检查，应对遮挡)
                # (日志显示 Like 需要 force，所以这是一个关键步骤)
                try:
                    loc.first.click(timeout=2000, force=True)
                    print(f"  [Click] {action_name}: SUCCESS (Force Click) on '{sel}'")
                    return True, sel + " (force)"
                except Exception as e_force:
                    error_msg = str(e_force).splitlines()[0]
                    print(f"  [Click] {action_name}: Force Click failed for '{sel}': {error_msg}")

                # 3. 尝试 JS Click (最后的手段)
                try:
                    handle = loc.first.element_handle()
                    if handle:
                        page.evaluate("el => el.click()", handle)
                        print(f"  [Click] {action_name}: SUCCESS (JS Click) on '{sel}'")
                        return True, sel + " (js)"
                except Exception as e_js:
                    error_msg = str(e_js).splitlines()[0]
                    print(f"  [Click] {action_name}: JS Click failed for '{sel}': {error_msg}")
                    
            except Exception as e_outer:
                error_msg = str(e_outer).splitlines()[0]
                print(f"  [Click] {action_name}: Error locating selector '{sel}': {error_msg}")
                
        print(f"  [Click] {action_name}: All candidates FAILED: {candidates}")
        return False, None
    # --- 辅助函数定义结束 ---


    try:
        note_selector = "section.note-item"
        notes = page.locator(note_selector)
        total = notes.count()
        if total == 0:
            print("错误：在探索页未找到任何 'section.note-item'。")
            return
    except Exception as e:
        print(f"无法获取 feed 列表: {e}")
        return

    processed = 0
    idx = 0
    while processed < max_items:
        try:
            notes = page.locator(note_selector)
            total = notes.count()
            if idx >= total:
                print("已遍历到列表末尾，尝试下拉加载更多...")
                # 下拉加载更多
                page.evaluate("window.scrollBy(0, window.innerHeight * 0.8)")
                time.sleep(1.5) # 等待加载
                total = notes.count()
                if idx >= total:
                    print("没有更多帖子可处理，退出浏览。")
                    break

            print(f"\n--- 正在处理第 {idx+1} 条 (已成功 {processed} 条) ---")
            
            # 定位当前 item 的封面链接并点击
            item = notes.nth(idx)
            try:
                cover = item.locator("a.cover")
                if cover.count() == 0:
                    print(f"  [Action] Item {idx}: 未找到 'a.cover'，点击整个 item。")
                    item.click()
                else:
                    print(f"  [Action] Item {idx}: 正在点击 'a.cover'...")
                    cover.first.click()
            except Exception as e_click_item:
                print(f"  [Error] 点击帖子失败 (idx={idx}): {e_click_item}")
                idx += 1
                continue

            # 进入详情页后，等待交互栏出现
            try:
                engage_bar_selector = "div.interactions.engage-bar"
                print(f"  [Wait] 等待交互栏出现: '{engage_bar_selector}'")
                page.locator(engage_bar_selector).wait_for(state="visible", timeout=8000)
                print("  [Wait] 交互栏已出现。")
            except Exception as e_wait:
                print(f"  [Warn] 等待交互栏超时 ({e_wait})，将继续尝试操作...")
                time.sleep(2) # 降级等待

            # 停留以满足平台限制
            print(f"  [Wait] 停留 {wait_seconds}s ...")
            time.sleep(wait_seconds)

            # --- 点击 Like ---
            print("  [Action] 尝试点赞 (Like)...")
            # 优先使用 lottie，因为它在最上层 (根据你的日志)
            like_candidates = [
                "div.interactions.engage-bar span.like-lottie", # 最优先，最具体
                "div.interactions.engage-bar span.like-wrapper",
                "span.like-lottie", # 原始日志中成功的选择器
            ]
            ok, used = robust_click(like_candidates, action_name="Like")
            if ok:
                print(f"  [Action] 点赞成功 (via {used})")
                time.sleep(0.5)
            else:
                print("  [Action] 点赞失败。")

            # --- 点击 Collect (收藏) ---
            print("  [Action] 尝试收藏 (Collect)...")
            # 根据你提供的 HTML，收藏按钮是 span.collect-wrapper 或 svg.collect-icon
            collect_candidates = [
                "div.interactions.engage-bar span.collect-wrapper", # 优先点击 wrapper
                "div.interactions.engage-bar svg.collect-icon",   # 其次点击 icon
                "span.collect-wrapper", # 全局降级
            ]
            ok, used = robust_click(collect_candidates, action_name="Collect")
            if ok:
                print(f"  [Action] 收藏成功 (via {used})")
                time.sleep(0.5)
            else:
                print("  [Action] 收藏失败。")

            # --- 关闭详情页 ---
            print("  [Action] 尝试关闭帖子详情...")
            # 根据你提供的 HTML, div.close-circle 是最外层容器
            close_candidates = [
                "div.close-circle", # 优先点击外层 div
                "div.close",        # 其次点击内层 div
                "xpath=//use[@xlink:href='#close']", # 最后尝试 SVG 图像
            ]
            ok, used = robust_click(close_candidates, action_name="Close")
            if ok:
                print(f"  [Action] 关闭详情成功 (via {used})")
            else:
                print("  [Action] 关闭详情失败。 尝试按 'Escape' 键。")
                try:
                    page.keyboard.press("Escape")
                except Exception as e_esc:
                    print(f"  [Error] 按 'Escape' 键失败: {e_esc}")

            processed += 1
            idx += 1
            # 小停顿以避免操作过快，并等待弹窗完全关闭
            print(f"--- 第 {idx} 条处理完毕 ---")
            time.sleep(0.8) 

        except Exception as e:
            ts = datetime.now().strftime("%Y%m%d_%H%M%S")
            logs_dir = Path("logs")
            logs_dir.mkdir(exist_ok=True)
            err_shot = logs_dir / f"browse_err_{ts}.png"
            try:
                page.screenshot(path=str(err_shot), full_page=True)
                print(f"  [Error] 处理帖子时出错，已保存截图: {err_shot}")
            except Exception:
                pass
            print(f"  [Error] 处理帖子出错 (idx={idx}): {e}")
            idx += 1
            
            # 尝试从错误中恢复（例如按 Escape 关闭可能卡住的弹窗）
            try:
                print("  [Recovery] 尝试按 'Escape' 键以恢复...")
                page.keyboard.press("Escape")
                time.sleep(1)
            except Exception:
                pass

    print(f"\n浏览与互动完成，共处理 {processed} 条帖子。")

if __name__ == "__main__":
    with sync_playwright() as playwright:
        run(playwright)

