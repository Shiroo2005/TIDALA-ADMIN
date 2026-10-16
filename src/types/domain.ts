import type { components } from "./api";

/**
 * Hand-friendly aliases over the OpenAPI-generated schemas.
 * Regenerate the source with `npm run gen:api` after replacing openapi.json.
 */
type Schemas = components["schemas"];

export type ApiResponse<T> = { message: string; data: T; path: string };
export type PageResponse<T> = {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
};

export type Role = "STUDENT" | "TEACHER" | "ADMIN";
export type UserSummary = Schemas["UserSummaryResponse"];
export type TokenPair = Schemas["TokenPairResponse"];
export type LoginResponse = Schemas["LoginResponse"];

export type AdminUser = Schemas["AdminUserResponse"];
export type BanUserCommand = Schemas["BanUserCommand"];
export type ModerationReasonCommand = Schemas["ModerationReasonCommand"];

export type PostSummary = Schemas["PostSummaryResponse"];
export type PostDetail = Schemas["PostDetailResponse"];
export type ModeratePostCommand = Schemas["ModeratePostCommand"];
export type PostStatus = "DRAFT" | "PUBLISHED" | "REJECTED";
export type CommentItem = Schemas["CommentResponse"];

export type ReportItem = Schemas["ReportResponse"];
export type ResolveReportCommand = Schemas["ResolveReportCommand"];

export type NotebookStudent = Schemas["NotebookStudentResponse"];
export type AdminAuditLog = Schemas["AdminAuditLogResponse"];

export type Province = Schemas["ProvinceResponse"];
export type SaveProvinceCommand = Schemas["SaveProvinceCommand"];
export type District = Schemas["DistrictResponse"];
export type SaveDistrictCommand = Schemas["SaveDistrictCommand"];
export type TagItem = Schemas["TagResponse"];
export type SaveTagCommand = Schemas["SaveTagCommand"];
export type TrainingLevel = Schemas["TrainingLevelResponse"];
export type SaveTrainingLevelCommand = Schemas["SaveTrainingLevelCommand"];

/** Backend error envelope (ApiErrorResponse): note snake_case `error_code`. */
export type ApiErrorBody = {
  error_code?: string;
  message?: string;
  errors?: { field?: string; code?: string; message?: string }[];
  path?: string;
};
