import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Admin from './pages/Admin';
import NotFound from './pages/NotFound';
import type { ReactNode } from 'react';

export interface RouteConfig {
  name: string;
  path: string;
  element: ReactNode;
  visible?: boolean;
}

const routes: RouteConfig[] = [
  {
    name: '仪表盘',
    path: '/',
    element: <Dashboard />,
    visible: false
  },
  {
    name: '登录',
    path: '/login',
    element: <Login />,
    visible: false
  },
  {
    name: '管理',
    path: '/admin',
    element: <Admin />,
    visible: false
  },
  {
    name: '404',
    path: '*',
    element: <NotFound />,
    visible: false
  }
];

export default routes;