import { axiosInstance } from "@/config/axios";
import type { ApiResponse, PageResponse, ReportItem, ResolveReportCommand } from "@/types/domain";

export type ListReportsParams = {
  page: number;
  size: number;
  status?: "PENDING" | "RESOLVED" | "DISMISSED";
  targetType?: "TEACHER" | "REVIEW";
};

export async function listReports(params: ListReportsParams): Promise<PageResponse<ReportItem>> {
  const { data } = await axiosInstance.get<ApiResponse<PageResponse<ReportItem>>>("/api/v1/reports", {
    params: { page: params.page, size: params.size, status: params.status, targetType: params.targetType },
  });
  return data.data;
}

export async function getReport(id: string): Promise<ReportItem> {
  const { data } = await axiosInstance.get<ApiResponse<ReportItem>>(`/api/v1/reports/${id}`);
  return data.data;
}

export async function resolveReport(id: string, body: ResolveReportCommand): Promise<void> {
  await axiosInstance.put(`/api/v1/reports/${id}/resolve`, body);
}
