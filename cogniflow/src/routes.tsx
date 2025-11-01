import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import ProfilePage from './pages/ProfilePage';
import DevToolsPage from './pages/DevToolsPage';
import Admin from './pages/Admin';
import NotFound from './pages/NotFound';
import { ProtectedRoute, PublicRoute } from './components/auth/ProtectedRoute';
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
    element: (
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    ),
    visible: false
  },
  {
    name: '登录',
    path: '/login',
    element: (
      <PublicRoute>
        <Login />
      </PublicRoute>
    ),
    visible: false
  },
  {
    name: '注册',
    path: '/register',
    element: (
      <PublicRoute>
        <Register />
      </PublicRoute>
    ),
    visible: false
  },

  {
    name: '个人资料',
    path: '/profile',
    element: (
      <ProtectedRoute>
        <ProfilePage />
      </ProtectedRoute>
    ),
    visible: false
  },
  {
    name: '开发者工具',
    path: '/dev-tools',
    element: (
      <ProtectedRoute>
        <DevToolsPage />
      </ProtectedRoute>
    ),
    visible: false
  },
  {
    name: '管理',
    path: '/admin',
    element: (
      <ProtectedRoute>
        <Admin />
      </ProtectedRoute>
    ),
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