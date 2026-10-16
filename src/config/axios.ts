import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { clearSession, getAccessToken, getRefreshToken, setTokens } from "@/features/auth/token-store";
import type { ApiResponse, TokenPair } from "@/types/domain";

/**
 * Same shape as Tidala_FE's src/config/axios.ts (baseURL from VITE_BE_API_URL,
 * vi language header), plus a single-flight refresh interceptor: parallel 401s
 * share one POST /api/v1/auth/refresh, mirroring the mobile app's pattern.
 * The API returns tokens in the response BODY (no httpOnly cookie flow in V2),
 * and refresh-token reuse detection server-side force-logs-out on reuse.
 */
export const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_BE_API_URL ?? "https://dev-v2-api.tidala.vn",
  timeout: 15000,
  headers: { "Content-Type": "application/json", "Accept-Language": "vi" },
});

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

let refreshPromise: Promise<string> | null = null;
let onSessionExpired: (() => void) | null = null;

/** AuthProvider registers a callback so a dead refresh token routes to /login. */
export function setSessionExpiredHandler(handler: () => void) {
  onSessionExpired = handler;
}

async function refreshAccessToken(): Promise<string> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new Error("NO_REFRESH_TOKEN");
  const { data } = await axios.post<ApiResponse<TokenPair>>(
    `${import.meta.env.VITE_BE_API_URL ?? "https://dev-v2-api.tidala.vn"}/api/v1/auth/refresh`,
    { refreshToken },
    { headers: { "Content-Type": "application/json" } },
  );
  setTokens(data.data);
  return data.data.accessToken;
}

axiosInstance.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined;
    const isAuthCall = original?.url?.includes("/auth/login") || original?.url?.includes("/auth/refresh");
    if (error.response?.status !== 401 || !original || original._retry || isAuthCall) {
      throw error;
    }
    original._retry = true;
    try {
      refreshPromise ??= refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
      const newToken = await refreshPromise;
      original.headers.Authorization = `Bearer ${newToken}`;
      return axiosInstance(original);
    } catch {
      clearSession();
      onSessionExpired?.();
      throw error;
    }
  },
);
