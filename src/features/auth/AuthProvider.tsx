import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { setSessionExpiredHandler } from "@/config/axios";
import type { UserSummary } from "@/types/domain";
import { loginRequest, logoutRequest, meRequest } from "./auth-api";
import { clearSession, getRefreshToken, getStoredUser, setTokens, setUser } from "./token-store";

type AuthState = {
  user: UserSummary | null;
  /** true while restoring a session from the stored refresh token */
  loading: boolean;
  login: (email: string, password: string, rememberMe: boolean) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export class NotAdminError extends Error {
  constructor() {
    super("Tài khoản này không có quyền ADMIN");
    this.name = "NotAdminError";
  }
}

function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<UserSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const forceLogout = useCallback(() => {
    clearSession();
    setUserState(null);
  }, []);

  useEffect(() => {
    setSessionExpiredHandler(forceLogout);
  }, [forceLogout]);

  // Restore: sessionStorage may still hold a refresh token + user snapshot.
  // The axios response interceptor performs the refresh on the first 401;
  // here we validate via /auth/me and re-check the role server-side.
  useEffect(() => {
    let cancelled = false;
    async function restore() {
      if (!getRefreshToken()) {
        setLoading(false);
        return;
      }
      const snapshot = getStoredUser();
      if (snapshot) setUserState(snapshot);
      try {
        const me = await meRequest();
        if (cancelled) return;
        if (me.role !== "ADMIN") {
          forceLogout();
        } else {
          setUser(me);
          setUserState(me);
        }
      } catch {
        if (!cancelled) forceLogout();
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void restore();
    return () => {
      cancelled = true;
    };
  }, [forceLogout]);

  const login = useCallback(async (email: string, password: string, rememberMe: boolean) => {
    const result = await loginRequest(email, password, rememberMe);
    if (result.user.role !== "ADMIN") {
      // Never persist a non-admin session in the admin console.
      clearSession();
      throw new NotAdminError();
    }
    setTokens(result.tokens);
    const summary: UserSummary = {
      id: result.user.id,
      email: result.user.email,
      fullName: result.user.fullName,
      role: result.user.role,
    };
    setUser(summary);
    setUserState(summary);
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = getRefreshToken();
    try {
      if (refreshToken) await logoutRequest(refreshToken);
    } catch {
      // Local session is cleared regardless of the server call's outcome.
    } finally {
      forceLogout();
    }
  }, [forceLogout]);

  const value = useMemo<AuthState>(() => ({ user, loading, login, logout }), [user, loading, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

export { AuthProvider, useAuth };
