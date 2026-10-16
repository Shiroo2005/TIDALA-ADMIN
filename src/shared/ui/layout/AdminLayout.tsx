import { BookOpen, Flag, LayoutDashboard, LogOut, Newspaper, ScrollText, Tags, Users } from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthProvider";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/utils/cn";

const NAV = [
  { to: "/", label: "Tổng quan", icon: LayoutDashboard, end: true },
  { to: "/users", label: "Người dùng", icon: Users },
  { to: "/posts", label: "Bài viết", icon: Newspaper },
  { to: "/reports", label: "Báo cáo vi phạm", icon: Flag },
  { to: "/notebook/students", label: "Học viên Notebook", icon: BookOpen },
  { to: "/catalog", label: "Danh mục", icon: Tags },
  { to: "/audit-logs", label: "Audit logs", icon: ScrollText },
] as const;

function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r bg-card md:flex">
        <div className="border-b px-5 py-4">
          <div className="text-lg font-bold">Tidala Admin</div>
          <div className="text-xs text-muted-foreground">Quản trị hệ thống · API V2</div>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={"end" in item && item.end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium",
                  isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )
              }
            >
              <item.icon className="size-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t p-4">
          <div className="mb-2 min-w-0">
            <div className="truncate text-sm font-medium">{user?.fullName}</div>
            <div className="truncate text-xs text-muted-foreground">{user?.email}</div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={async () => {
              await logout();
              navigate("/login", { replace: true });
            }}
          >
            <LogOut /> Đăng xuất
          </Button>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        {/* Mobile top bar with horizontal nav */}
        <header className="sticky top-0 z-40 border-b bg-card px-4 py-3 md:hidden">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-bold">Tidala Admin</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                await logout();
                navigate("/login", { replace: true });
              }}
            >
              <LogOut /> Đăng xuất
            </Button>
          </div>
          <nav className="flex gap-1 overflow-x-auto">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={"end" in item && item.end}
                className={({ isActive }) =>
                  cn(
                    "whitespace-nowrap rounded-md px-2 py-1.5 text-xs font-medium",
                    isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground",
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </header>
        <main className="mx-auto max-w-7xl p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
export { AdminLayout };
