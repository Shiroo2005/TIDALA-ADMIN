import { axiosInstance } from "@/config/axios";
import type {
  ApiResponse,
  District,
  PageResponse,
  Province,
  SaveDistrictCommand,
  SaveProvinceCommand,
  SaveTagCommand,
  SaveTrainingLevelCommand,
  TagItem,
  TrainingLevel,
} from "@/types/domain";

/**
 * Catalog endpoints are NOT under /admin in V2 — they live at /provinces,
 * /districts, /tags, /training-levels and are presumably ADMIN-guarded
 * server-side for writes. Verify against the backend if a STUDENT token can
 * call them (flagged in ADMIN-PROJECT-SCOPE / README).
 */
const page = { page: 0, size: 20 };

export async function listProvinces(p: number, size: number, q?: string): Promise<PageResponse<Province>> {
  const { data } = await axiosInstance.get<ApiResponse<PageResponse<Province>>>("/api/v1/provinces", {
    params: { page: p, size, q: q || undefined },
  });
  return data.data;
}
export async function createProvince(body: SaveProvinceCommand): Promise<void> {
  await axiosInstance.post("/api/v1/provinces", body);
}
export async function updateProvince(id: string, body: SaveProvinceCommand): Promise<void> {
  await axiosInstance.put(`/api/v1/provinces/${id}`, body);
}
export async function deleteProvince(id: string): Promise<void> {
  await axiosInstance.delete(`/api/v1/provinces/${id}`);
}
export async function bulkCreateProvinces(provinces: { name: string; districts?: { name: string }[] }[]): Promise<void> {
  await axiosInstance.post("/api/v1/provinces/bulk", { provinces });
}

export async function listDistricts(p: number, size: number, q?: string, provinceId?: string): Promise<PageResponse<District>> {
  const { data } = await axiosInstance.get<ApiResponse<PageResponse<District>>>("/api/v1/districts", {
    params: { page: p, size, q: q || undefined, provinceId: provinceId || undefined },
  });
  return data.data;
}
export async function createDistrict(body: SaveDistrictCommand): Promise<void> {
  await axiosInstance.post("/api/v1/districts", body);
}
export async function updateDistrict(id: string, body: SaveDistrictCommand): Promise<void> {
  await axiosInstance.put(`/api/v1/districts/${id}`, body);
}
export async function deleteDistrict(id: string): Promise<void> {
  await axiosInstance.delete(`/api/v1/districts/${id}`);
}

export async function listTags(p: number, size: number, q?: string, type?: string): Promise<PageResponse<TagItem>> {
  const { data } = await axiosInstance.get<ApiResponse<PageResponse<TagItem>>>("/api/v1/tags", {
    params: { page: p, size, q: q || undefined, type: type || undefined },
  });
  return data.data;
}
export async function createTag(body: SaveTagCommand): Promise<void> {
  await axiosInstance.post("/api/v1/tags", body);
}
export async function updateTag(id: string, body: SaveTagCommand): Promise<void> {
  await axiosInstance.put(`/api/v1/tags/${id}`, body);
}
export async function deleteTag(id: string): Promise<void> {
  await axiosInstance.delete(`/api/v1/tags/${id}`);
}

export async function listTrainingLevels(p: number, size: number, q?: string): Promise<PageResponse<TrainingLevel>> {
  const { data } = await axiosInstance.get<ApiResponse<PageResponse<TrainingLevel>>>("/api/v1/training-levels", {
    params: { page: p, size, q: q || undefined },
  });
  return data.data;
}
export async function createTrainingLevel(body: SaveTrainingLevelCommand): Promise<void> {
  await axiosInstance.post("/api/v1/training-levels", body);
}
export async function updateTrainingLevel(id: string, body: SaveTrainingLevelCommand): Promise<void> {
  await axiosInstance.put(`/api/v1/training-levels/${id}`, body);
}
export async function deleteTrainingLevel(id: string): Promise<void> {
  await axiosInstance.delete(`/api/v1/training-levels/${id}`);
}
export async function bulkCreateTrainingLevels(
  trainingLevels: { name: string; description?: string; orderPosition?: number }[],
): Promise<void> {
  await axiosInstance.post("/api/v1/training-levels/bulk", { trainingLevels });
}

export const defaultPageParams = page;
