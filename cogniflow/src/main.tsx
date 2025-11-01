import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { AppWrapper } from "./components/common/PageMeta.tsx";
import { ThemeProvider } from "./components/theme-provider.tsx";
import { localAuth } from "./db/localAuth";
import { testUserSystem } from "./utils/testUserSystem";
import { clearAllLocalStorage } from "./utils/clearStorage";

// 初始化认证系统
localAuth.initialize().catch(console.error);

// 在开发环境中暴露调试函数（仅供开发者使用）
if (import.meta.env.DEV && localStorage.getItem('cogniflow_debug') === 'true') {
  (window as any).testUserSystem = testUserSystem;
  (window as any).clearAllStorage = clearAllLocalStorage;
  console.log('🔧 开发调试模式已启用。要禁用，请运行：localStorage.removeItem("cogniflow_debug")');
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="light" storageKey="cogniflow-theme">
      <AppWrapper>
        <App />
      </AppWrapper>
    </ThemeProvider>
  </StrictMode>
);
