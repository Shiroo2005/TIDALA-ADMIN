import { axiosInstance } from "@/config/axios";
import type { AdminAuditLog, ApiResponse, PageResponse } from "@/types/domain";

export type ListAuditLogsParams = {
  page: number;
  size: number;
  actorId?: string;
  action?: string;
  targetType?: string;
  targetId?: string;
  from?: string;
  to?: string;
};

export async function listAuditLogs(params: ListAuditLogsParams): Promise<PageResponse<AdminAuditLog>> {
  const { data } = await axiosInstance.get<ApiResponse<PageResponse<AdminAuditLog>>>("/api/v1/admin/audit-logs", {
    params: {
      page: params.page,
      size: params.size,
      actorId: params.actorId || undefined,
      action: params.action || undefined,
      targetType: params.targetType || undefined,
      targetId: params.targetId || undefined,
      from: params.from || undefined,
      to: params.to || undefined,
    },
  });
  return data.data;
}

export async function getAuditLog(id: string): Promise<AdminAuditLog> {
  const { data } = await axiosInstance.get<ApiResponse<AdminAuditLog>>(`/api/v1/admin/audit-logs/${id}`);
  return data.data;
}
