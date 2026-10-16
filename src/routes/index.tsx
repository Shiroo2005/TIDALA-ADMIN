import { Suspense, lazy, type ReactNode } from "react";
import { Navigate, createBrowserRouter } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthProvider";
import { LoginPage } from "@/features/auth/LoginPage";
import { AdminLayout } from "@/shared/ui/layout/AdminLayout";

// Route-level code splitting: each module ships as its own chunk
// (the dashboard pulls in recharts, the heaviest dependency).
const DashboardPage = lazy(() => import("@/features/dashboard/DashboardPage").then((m) => ({ default: m.DashboardPage })));
const UsersPage = lazy(() => import("@/features/users/UsersPage").then((m) => ({ default: m.UsersPage })));
const PostsPage = lazy(() => import("@/features/posts/PostsPage").then((m) => ({ default: m.PostsPage })));
const PostDetailPage = lazy(() => import("@/features/posts/PostDetailPage").then((m) => ({ default: m.PostDetailPage })));
const ReportsPage = lazy(() => import("@/features/reports/ReportsPage").then((m) => ({ default: m.ReportsPage })));
const NotebookStudentsPage = lazy(() =>
  import("@/features/notebook/NotebookStudentsPage").then((m) => ({ default: m.NotebookStudentsPage })),
);
const CatalogPage = lazy(() => import("@/features/catalog/CatalogPage").then((m) => ({ default: m.CatalogPage })));
const AuditLogsPage = lazy(() => import("@/features/audit-logs/AuditLogsPage").then((m) => ({ default: m.AuditLogsPage })));

function PageFallback() {
  return (
    <div className="flex items-center justify-center py-16">
      <span className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}

function suspended(node: ReactNode) {
  return <Suspense fallback={<PageFallback />}>{node}</Suspense>;
}

/** Mirrors Tidala_FE's AdminRoute guard: no session -> /login; non-ADMIN never reaches here (AuthProvider rejects at login/restore). */
function RequireAdmin({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  {
    element: (
      <RequireAdmin>
        <AdminLayout />
      </RequireAdmin>
    ),
    children: [
      { index: true, element: suspended(<DashboardPage />) },
      { path: "users", element: suspended(<UsersPage />) },
      { path: "posts", element: suspended(<PostsPage />) },
      { path: "posts/:postId", element: suspended(<PostDetailPage />) },
      { path: "reports", element: suspended(<ReportsPage />) },
      { path: "notebook/students", element: suspended(<NotebookStudentsPage />) },
      { path: "catalog", element: suspended(<CatalogPage />) },
      { path: "audit-logs", element: suspended(<AuditLogsPage />) },
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
]);
