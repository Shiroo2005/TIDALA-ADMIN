import {
  BookOpen,
  ChevronsLeft,
  ChevronsRight,
  Flag,
  LayoutDashboard,
  LogOut,
  Newspaper,
  ScrollText,
  Tags,
  Users,
} from "lucide-react";
import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import tidalaLogo from "@/assets/Tidala_Logo.webp";
import { useAuth } from "@/features/auth/AuthProvider";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/utils/cn";

/**
 * Layout mirrors Tidala_FE's shared/components/layout/AdminLayout:
 * white sidebar (border slate-200/70), logo + gradient "TIDALA Admin" wordmark,
 * "Quản lý" section label, rounded-xl nav items with a brand-blue active state
 * (bg-brand/8, 3px indicator bar), and a gradient user card in the footer.
 */
const NAV = [
  { to: "/", label: "Tổng quan", icon: LayoutDashboard, end: true },
  { to: "/users", label: "Quản lý Người dùng", icon: Users },
  { to: "/posts", label: "Quản lý Bài đăng", icon: Newspaper },
  { to: "/reports", label: "Xử lý Báo cáo", icon: Flag },
  { to: "/notebook/students", label: "Học viên Notebook", icon: BookOpen },
  { to: "/catalog", label: "Thẻ & Danh mục", icon: Tags },
  { to: "/audit-logs", label: "Audit Logs", icon: ScrollText },
] as const;

function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50/50 selection:bg-brand/20">
      {/* Sidebar — desktop */}
      <aside
        className={cn(
          "z-50 hidden h-full shrink-0 flex-col overflow-hidden border-r border-slate-200/70 bg-white transition-all duration-300 md:flex",
          collapsed ? "w-[72px]" : "w-72",
        )}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-100 px-4">
          <Link to="/" className="flex items-center space-x-3 overflow-hidden transition-all hover:opacity-90">
            <img src={tidalaLogo} alt="TIDALA" className="size-10 shrink-0 object-contain drop-shadow-sm" />
            {!collapsed ? (
              <span className="bg-linear-to-br from-blue-700 via-blue-500 to-cyan-400 bg-clip-text text-xl font-extrabold whitespace-nowrap text-transparent tracking-wide">
                TIDALA Admin
              </span>
            ) : null}
          </Link>
          <button
            onClick={() => setCollapsed((v) => !v)}
            className="flex items-center justify-center rounded-lg p-1.5 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-700"
            aria-label={collapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
          >
            {collapsed ? <ChevronsRight size={20} /> : <ChevronsLeft size={20} />}
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-5">
          <div className="mb-3 px-3">
            <span className="text-[11px] font-bold tracking-[0.12em] text-slate-400 uppercase">
              {collapsed ? "•••" : "Quản lý"}
            </span>
          </div>
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={"end" in item && item.end}
              title={collapsed ? item.label : undefined}
              className={({ isActive }) =>
                cn(
                  "group relative flex items-center gap-3 overflow-hidden rounded-xl px-3 py-2.5 transition-all duration-200",
                  collapsed && "justify-center px-0",
                  isActive
                    ? "bg-brand/[0.08] text-brand shadow-sm shadow-brand/5"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-800",
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive ? (
                    <span className="absolute top-1/2 left-0 h-7 w-[3px] -translate-y-1/2 rounded-r-full bg-brand" />
                  ) : null}
                  <item.icon
                    size={20}
                    className={cn("shrink-0 transition-all", isActive ? "text-brand" : "text-slate-400 group-hover:text-slate-700")}
                  />
                  {!collapsed ? <span className="text-[13.5px] font-medium whitespace-nowrap">{item.label}</span> : null}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto border-t border-slate-100 p-3">
          {!collapsed ? (
            <div className="flex items-center gap-3 rounded-xl border border-slate-100/80 bg-gradient-to-r from-slate-50 to-slate-50/50 p-3 transition-all hover:border-slate-200">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="size-10 shrink-0 rounded-lg object-cover shadow-sm ring-2 ring-white" />
              ) : (
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-slate-200 text-xs font-semibold shadow-sm ring-2 ring-white">
                  {(user?.fullName ?? "?").slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1 overflow-hidden">
                <p className="truncate text-sm leading-tight font-semibold text-slate-800">{user?.fullName}</p>
                <p className="mt-0.5 truncate text-[11px] leading-tight text-slate-400">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="shrink-0 rounded-lg p-1.5 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-700"
                aria-label="Đăng xuất"
                title="Đăng xuất"
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              className="mx-auto flex size-10 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition-all hover:bg-slate-200 hover:text-slate-700"
              aria-label="Đăng xuất"
              title={`Đăng xuất (${user?.fullName ?? ""})`}
            >
              <LogOut size={18} />
            </button>
          )}
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Mobile top bar */}
        <header className="shrink-0 border-b border-slate-200/70 bg-white px-4 py-3 md:hidden">
          <div className="mb-2 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <img src={tidalaLogo} alt="TIDALA" className="size-8 object-contain" />
              <span className="bg-linear-to-br from-blue-700 via-blue-500 to-cyan-400 bg-clip-text font-extrabold text-transparent">
                TIDALA Admin
              </span>
            </span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
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
                    "rounded-lg px-2.5 py-2 text-xs font-medium whitespace-nowrap",
                    isActive ? "bg-brand/[0.08] text-brand" : "text-slate-500",
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto">
          <div className="animate-page-in mx-auto max-w-7xl p-4 md:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
export { AdminLayout };
