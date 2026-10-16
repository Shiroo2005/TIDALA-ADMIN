import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Pin, PinOff } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { DataTable } from "@/shared/components/DataTable";
import { ReasonDialog } from "@/shared/components/ReasonDialog";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { Button } from "@/shared/components/ui/button";
import { Dialog } from "@/shared/components/ui/dialog";
import { Select } from "@/shared/components/ui/select";
import { Textarea } from "@/shared/components/ui/textarea";
import { getErrorMessage } from "@/shared/api/api-error";
import { formatDateTime } from "@/shared/utils/format";
import type { PostStatus, PostSummary } from "@/types/domain";
import { deleteAdminPost, listAdminPosts, moderatePostStatus, pinPost, unpinPost } from "./posts-api";

const PAGE_SIZE = 20;
type DialogState =
  | { kind: "delete"; post: PostSummary }
  | { kind: "moderate"; post: PostSummary }
  | null;

function PostsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [status, setStatus] = useState<PostStatus | "">("");
  const [dialog, setDialog] = useState<DialogState>(null);
  const [moderateStatus, setModerateStatus] = useState<"DRAFT" | "REJECTED">("REJECTED");
  const [moderateReason, setModerateReason] = useState("");
  const [moderateDesc, setModerateDesc] = useState("");

  const query = useQuery({
    queryKey: ["admin-posts", page, status],
    queryFn: () => listAdminPosts(page, PAGE_SIZE, status || undefined),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin-posts"] });
  const onDone = (msg: string) => () => {
    toast.success(msg);
    setDialog(null);
    invalidate();
  };
  const onFail = (e: unknown) => toast.error(getErrorMessage(e));

  const pinMutation = useMutation({
    mutationFn: (v: { id: string; pinned: boolean }) => (v.pinned ? unpinPost(v.id) : pinPost(v.id)),
    onSuccess: onDone("Đã cập nhật ghim bài viết"),
    onError: onFail,
  });
  const deleteMutation = useMutation({
    mutationFn: (v: { id: string; reason: string; description?: string }) =>
      deleteAdminPost(v.id, { reason: v.reason, description: v.description }),
    onSuccess: onDone("Đã xoá bài viết"),
    onError: onFail,
  });
  const moderateMutation = useMutation({
    mutationFn: (v: { id: string; status: "DRAFT" | "REJECTED"; reason: string; description?: string }) =>
      moderatePostStatus(v.id, { status: v.status, reason: v.reason, description: v.description || undefined }),
    onSuccess: onDone("Đã cập nhật trạng thái bài viết"),
    onError: onFail,
  });

  const columns = useMemo<ColumnDef<PostSummary>[]>(
    () => [
      {
        header: "Bài viết",
        cell: ({ row }) => (
          <div className="max-w-md">
            <Link to={`/posts/${row.original.id}`} className="font-medium hover:underline">
              {row.original.title}
            </Link>
            <div className="line-clamp-2 text-xs text-muted-foreground">{row.original.excerpt}</div>
            <div className="mt-1 text-xs text-muted-foreground">
              {row.original.authorName} · {row.original.category} · ♥ {row.original.likeCount ?? 0} · 💬 {row.original.commentCount ?? 0}
            </div>
          </div>
        ),
      },
      { header: "Trạng thái", cell: ({ row }) => <StatusBadge value={row.original.status} /> },
      {
        header: "Ghim",
        cell: ({ row }) => (row.original.pinnedAt ? formatDateTime(row.original.pinnedAt) : <span className="text-muted-foreground">—</span>),
      },
      { header: "Ngày tạo", cell: ({ row }) => formatDateTime(row.original.createdAt) },
      {
        header: "Thao tác",
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            <Button
              size="sm"
              variant="outline"
              title={row.original.pinnedAt ? "Bỏ ghim" : "Ghim"}
              onClick={() => pinMutation.mutate({ id: row.original.id!, pinned: Boolean(row.original.pinnedAt) })}
            >
              {row.original.pinnedAt ? <PinOff /> : <Pin />}
            </Button>
            <Button size="sm" variant="outline" onClick={() => { setModerateStatus("REJECTED"); setModerateReason(""); setModerateDesc(""); setDialog({ kind: "moderate", post: row.original }); }}>
              Kiểm duyệt
            </Button>
            <Button size="sm" variant="destructive" onClick={() => setDialog({ kind: "delete", post: row.original })}>
              Xoá
            </Button>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pinMutation],
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Bài viết</h1>
        <p className="text-sm text-muted-foreground">
          Kiểm duyệt: API chỉ cho chuyển sang DRAFT hoặc REJECTED (không set PUBLISHED qua endpoint admin).
        </p>
      </div>
      <Select
        className="w-52"
        value={status}
        onChange={(e) => {
          setStatus(e.target.value as PostStatus | "");
          setPage(0);
        }}
      >
        <option value="">Tất cả trạng thái</option>
        <option value="DRAFT">DRAFT</option>
        <option value="PUBLISHED">PUBLISHED</option>
        <option value="REJECTED">REJECTED</option>
      </Select>

      <DataTable
        columns={columns}
        data={query.data?.content ?? []}
        isLoading={query.isLoading}
        isError={query.isError}
        errorMessage={query.error ? getErrorMessage(query.error) : undefined}
        page={page}
        size={PAGE_SIZE}
        totalElements={query.data?.totalElements ?? 0}
        totalPages={query.data?.totalPages ?? 0}
        onPageChange={setPage}
      />

      <ReasonDialog
        open={dialog?.kind === "delete"}
        title={`Xoá bài "${dialog?.kind === "delete" ? dialog.post.title : ""}"`}
        confirmLabel="Xoá bài viết"
        destructive
        isPending={deleteMutation.isPending}
        onClose={() => setDialog(null)}
        onConfirm={(v) => {
          if (dialog?.kind === "delete") deleteMutation.mutate({ id: dialog.post.id!, reason: v.reason, description: v.description });
        }}
      />

      <Dialog open={dialog?.kind === "moderate"} onClose={() => setDialog(null)} title="Kiểm duyệt bài viết" description="Lý do hiển thị cho tác giả và lưu vào audit log.">
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Trạng thái mới</label>
            <Select value={moderateStatus} onChange={(e) => setModerateStatus(e.target.value as "DRAFT" | "REJECTED")}>
              <option value="REJECTED">REJECTED</option>
              <option value="DRAFT">DRAFT</option>
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Lý do (5–500 ký tự)</label>
            <Textarea rows={3} value={moderateReason} onChange={(e) => setModerateReason(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Mô tả nội bộ (tuỳ chọn)</label>
            <Textarea rows={2} value={moderateDesc} onChange={(e) => setModerateDesc(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDialog(null)}>Huỷ</Button>
            <Button
              disabled={moderateReason.trim().length < 5 || moderateMutation.isPending}
              onClick={() => {
                if (dialog?.kind === "moderate")
                  moderateMutation.mutate({ id: dialog.post.id!, status: moderateStatus, reason: moderateReason.trim(), description: moderateDesc || undefined });
              }}
            >
              {moderateMutation.isPending ? "Đang xử lý…" : "Xác nhận"}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
export { PostsPage };
