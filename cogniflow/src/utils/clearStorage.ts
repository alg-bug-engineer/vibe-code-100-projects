/**
 * 清空本地存储的工具函数
 */

export function clearAllLocalStorage() {
  // 清空所有相关的 localStorage 数据
  const keys = Object.keys(localStorage);
  const cogniflowKeys = keys.filter(key => 
    key.startsWith('cogniflow_') || 
    key === 'cogniflow-theme' || 
    key.startsWith('vite-')
  );

  cogniflowKeys.forEach(key => {
    localStorage.removeItem(key);
  });

  // 也清空 sessionStorage
  sessionStorage.clear();

  console.log('已清空所有 CogniFlow 相关的本地存储数据');
}