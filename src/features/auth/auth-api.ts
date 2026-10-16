import { axiosInstance } from "@/config/axios";
import type { ApiResponse, LoginResponse, UserSummary } from "@/types/domain";

export async function loginRequest(email: string, password: string, rememberMe: boolean): Promise<LoginResponse> {
  const { data } = await axiosInstance.post<ApiResponse<LoginResponse>>("/api/v1/auth/login", {
    email,
    password,
    rememberMe,
  });
  return data.data;
}

export async function meRequest(): Promise<UserSummary> {
  const { data } = await axiosInstance.get<ApiResponse<UserSummary>>("/api/v1/auth/me");
  return data.data;
}

export async function logoutRequest(refreshToken: string): Promise<void> {
  await axiosInstance.post("/api/v1/auth/logout", { refreshToken });
}
