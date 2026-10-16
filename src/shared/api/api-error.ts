import { isAxiosError } from "axios";
import type { ApiErrorBody } from "@/types/domain";

/** Pull a human message out of the backend error envelope ({ error_code, message, errors[] }). */
export function getErrorMessage(error: unknown, fallback = "Đã có lỗi xảy ra"): string {
  if (isAxiosError<ApiErrorBody>(error)) {
    const body = error.response?.data;
    const fieldErrors = body?.errors?.map((e) => e.message).filter(Boolean);
    if (fieldErrors?.length) return fieldErrors.join("; ");
    if (body?.message) return body.message;
    if (error.response?.status === 401) return "Phiên đăng nhập đã hết hạn";
    if (error.response?.status === 403) return "Tài khoản không có quyền admin";
    return error.message || fallback;
  }
  return error instanceof Error ? error.message : fallback;
}

export function getErrorCode(error: unknown): string | undefined {
  if (isAxiosError<ApiErrorBody>(error)) return error.response?.data?.error_code;
  return undefined;
}
