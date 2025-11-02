import { Link, useNavigate } from "react-router-dom";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Shield, Download, Upload, User, LogOut } from "lucide-react";
import { useAuth, exportData, importData } from "@/db/api";
import { toast } from "sonner";

export default function Header() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('已登出');
    navigate('/login');
  };

  const getUserDisplayName = () => {
    if (user?.username) return user.username;
    if (user?.email) return user.email.split('@')[0];
    return '用户';
  };

  const getUserInitials = () => {
    const name = getUserDisplayName();
    return name.slice(0, 2).toUpperCase();
  };

  const handleExport = async () => {
    try {
      const data = await exportData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cogniflow-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('数据导出成功');
    } catch (error) {
      toast.error('导出失败');
      console.error(error);
    }
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        await importData(text);
        toast.success('数据导入成功，正在刷新...');
        setTimeout(() => window.location.reload(), 1000);
      } catch (error) {
        toast.error('导入失败，请检查文件格式');
        console.error(error);
      }
    };
    input.click();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <div className="mr-4 flex">
          <Link to="/" className="mr-6 flex items-center space-x-2">
            <span className="font-bold sm:inline-block">
              CogniFlow
            </span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
          <nav className="flex items-center space-x-2">
            {user && isAdmin && (
              <Button variant="ghost" size="sm" onClick={() => navigate('/admin')}>
                <Shield className="h-4 w-4 mr-2" />
                管理
              </Button>
            )}
            {user && (
              <>
                <Button variant="ghost" size="sm" onClick={handleExport} title="导出数据">
                  <Download className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={handleImport} title="导入数据">
                  <Upload className="h-4 w-4" />
                </Button>
              </>
            )}
            <ModeToggle />
            
            {/* 用户菜单 */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="" alt={getUserDisplayName()} />
                      <AvatarFallback className="text-xs">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {getUserDisplayName()}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email || '无邮箱'}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {user.role === 'admin' ? '管理员' : '用户'}
                        </Badge>
                        {user.username && (
                          <Badge variant="outline" className="text-xs">
                            @{user.username}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <User className="mr-2 h-4 w-4" />
                    <span>个人资料</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/admin')} disabled={!isAdmin}>
                    <Shield className="mr-2 h-4 w-4" />
                    <span>系统管理</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>登出</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="outline" size="sm" onClick={() => navigate('/login')}>
                <User className="h-4 w-4 mr-2" />
                登录
              </Button>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}