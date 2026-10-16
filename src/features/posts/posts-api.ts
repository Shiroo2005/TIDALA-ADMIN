import { axiosInstance } from "@/config/axios";
import type {
  ApiResponse,
  CommentItem,
  ModeratePostCommand,
  ModerationReasonCommand,
  PageResponse,
  PostDetail,
  PostStatus,
  PostSummary,
} from "@/types/domain";

export async function listAdminPosts(page: number, size: number, status?: PostStatus): Promise<PageResponse<PostSummary>> {
  const { data } = await axiosInstance.get<ApiResponse<PageResponse<PostSummary>>>("/api/v1/admin/posts", {
    params: { page, size, status },
  });
  return data.data;
}

export async function getAdminPost(id: string): Promise<PostDetail> {
  const { data } = await axiosInstance.get<ApiResponse<PostDetail>>(`/api/v1/admin/posts/${id}`);
  return data.data;
}

export async function moderatePostStatus(id: string, body: ModeratePostCommand): Promise<void> {
  await axiosInstance.put(`/api/v1/admin/posts/${id}/status`, body);
}

export async function deleteAdminPost(id: string, body: ModerationReasonCommand): Promise<void> {
  await axiosInstance.post(`/api/v1/admin/posts/${id}/delete`, body);
}

export async function pinPost(id: string): Promise<void> {
  await axiosInstance.put(`/api/v1/admin/posts/${id}/pin`);
}

export async function unpinPost(id: string): Promise<void> {
  await axiosInstance.delete(`/api/v1/admin/posts/${id}/pin`);
}

export async function listPostComments(postId: string, page: number, size: number): Promise<PageResponse<CommentItem>> {
  const { data } = await axiosInstance.get<ApiResponse<PageResponse<CommentItem>>>(`/api/v1/posts/${postId}/comments`, {
    params: { page, size },
  });
  return data.data;
}

export async function listCommentReplies(commentId: string): Promise<CommentItem[]> {
  const { data } = await axiosInstance.get<ApiResponse<CommentItem[]>>(`/api/v1/comments/${commentId}/replies`);
  return data.data;
}

export async function deleteAdminComment(id: string, body: ModerationReasonCommand): Promise<void> {
  await axiosInstance.post(`/api/v1/admin/comments/${id}/delete`, body);
}
