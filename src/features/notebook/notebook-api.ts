import { axiosInstance } from "@/config/axios";
import type { ApiResponse, NotebookStudent, PageResponse } from "@/types/domain";

export type ListNotebookStudentsParams = {
  page: number;
  size: number;
  teacherUserId?: string;
  courseId?: string;
  status?: string;
  keyword?: string;
};

export async function listNotebookStudents(params: ListNotebookStudentsParams): Promise<PageResponse<NotebookStudent>> {
  const { data } = await axiosInstance.get<ApiResponse<PageResponse<NotebookStudent>>>("/api/v1/admin/notebook/students", {
    params: {
      page: params.page,
      size: params.size,
      teacherUserId: params.teacherUserId || undefined,
      courseId: params.courseId || undefined,
      status: params.status || undefined,
      keyword: params.keyword || undefined,
    },
  });
  return data.data;
}
