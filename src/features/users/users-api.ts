import { axiosInstance } from "@/config/axios";
import type { AdminUser, ApiResponse, BanUserCommand, ModerationReasonCommand, PageResponse, Role } from "@/types/domain";

export type ListUsersParams = {
  page: number;
  size: number;
  role?: Role;
  keyword?: string;
  banned?: boolean;
};

export async function listUsers(params: ListUsersParams): Promise<PageResponse<AdminUser>> {
  const { data } = await axiosInstance.get<ApiResponse<PageResponse<AdminUser>>>("/api/v1/admin/users", {
    params: {
      page: params.page,
      size: params.size,
      role: params.role,
      keyword: params.keyword || undefined,
      // Backend default is banned=false; only send the filter when explicitly on.
      banned: params.banned ? true : undefined,
    },
  });
  return data.data;
}

export async function banUser(id: string, body: BanUserCommand): Promise<void> {
  await axiosInstance.post(`/api/v1/admin/users/${id}/ban`, body);
}

export async function unbanUser(id: string, body: ModerationReasonCommand): Promise<void> {
  await axiosInstance.post(`/api/v1/admin/users/${id}/unban`, body);
}
