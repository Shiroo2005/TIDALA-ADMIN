import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Navigate, useLocation } from "react-router-dom";
import { z } from "zod";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import tidalaLogo from "@/assets/Tidala_Logo.webp";
import { getErrorMessage } from "@/shared/api/api-error";
import { NotAdminError, useAuth } from "./AuthProvider";

const schema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(1, "Nhập mật khẩu"),
  rememberMe: z.boolean(),
});
type FormValues = z.infer<typeof schema>;

function LoginPage() {
  const { user, loading, login } = useAuth();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "", rememberMe: false },
  });

  if (!loading && user) {
    const from = (location.state as { from?: string } | null)?.from ?? "/";
    return <Navigate to={from} replace />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50/50 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <img src={tidalaLogo} alt="TIDALA" className="size-14 object-contain" />
          <CardTitle className="bg-linear-to-br from-blue-700 via-blue-500 to-cyan-400 bg-clip-text text-2xl font-extrabold tracking-wide text-transparent">
            TIDALA Admin
          </CardTitle>
          <CardDescription>Đăng nhập bằng tài khoản có vai trò ADMIN.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit(async (v) => {
              setError(null);
              try {
                await login(v.email, v.password, v.rememberMe);
              } catch (e) {
                setError(e instanceof NotAdminError ? e.message : getErrorMessage(e, "Đăng nhập thất bại"));
              }
            })}
          >
            <div>
              <label className="mb-1 block text-sm font-medium" htmlFor="email">Email</label>
              <Input id="email" type="email" autoComplete="email" {...form.register("email")} />
              {form.formState.errors.email ? <p className="mt-1 text-sm text-destructive">{form.formState.errors.email.message}</p> : null}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium" htmlFor="password">Mật khẩu</label>
              <Input id="password" type="password" autoComplete="current-password" {...form.register("password")} />
              {form.formState.errors.password ? <p className="mt-1 text-sm text-destructive">{form.formState.errors.password.message}</p> : null}
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="size-4" {...form.register("rememberMe")} />
              Ghi nhớ đăng nhập (refresh token 90 ngày thay vì 7 ngày)
            </label>
            {error ? <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p> : null}
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Đang đăng nhập…" : "Đăng nhập"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
export { LoginPage };
