import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ReasonDialog } from "@/shared/components/ReasonDialog";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { getErrorMessage } from "@/shared/api/api-error";
import { formatDateTime } from "@/shared/utils/format";
import type { CommentItem } from "@/types/domain";
import { deleteAdminComment, getAdminPost, listPostComments } from "./posts-api";

const COMMENT_PAGE_SIZE = 20;

/** Post content is a string in V2; the user FE authors posts with EditorJS, so try JSON blocks, fall back to plain text. */
function renderContent(content?: string): string {
  if (!content) return "";
  try {
    const parsed = JSON.parse(content) as { blocks?: { type: string; data?: { text?: string } }[] };
    if (Array.isArray(parsed.blocks)) {
      return parsed.blocks.map((b) => b.data?.text ?? "").filter(Boolean).join("\n\n");
    }
  } catch {
    // plain text content
  }
  return content;
}

function PostDetailPage() {
  const { postId } = useParams<{ postId: string }>();
  const queryClient = useQueryClient();
  const [commentPage, setCommentPage] = useState(0);
  const [commentToDelete, setCommentToDelete] = useState<CommentItem | null>(null);

  const postQuery = useQuery({
    queryKey: ["admin-post", postId],
    queryFn: () => getAdminPost(postId!),
    enabled: Boolean(postId),
  });
  const commentsQuery = useQuery({
    queryKey: ["post-comments", postId, commentPage],
    queryFn: () => listPostComments(postId!, commentPage, COMMENT_PAGE_SIZE),
    enabled: Boolean(postId),
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (v: { id: string; reason: string; description?: string }) =>
      deleteAdminComment(v.id, { reason: v.reason, description: v.description }),
    onSuccess: () => {
      toast.success("Đã xoá bình luận");
      setCommentToDelete(null);
      queryClient.invalidateQueries({ queryKey: ["post-comments", postId] });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  if (postQuery.isLoading) return <p className="text-muted-foreground">Đang tải…</p>;
  if (postQuery.isError || !postQuery.data) {
    return <p className="text-destructive">{postQuery.error ? getErrorMessage(postQuery.error) : "Không tìm thấy bài viết"}</p>;
  }

  const { post, content, images } = postQuery.data;

  return (
    <div className="space-y-4">
      <Link to="/posts" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Quay lại danh sách
      </Link>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-xl">{post?.title}</CardTitle>
            <StatusBadge value={post?.status} />
            {post?.pinnedAt ? <span className="text-xs text-muted-foreground">Đã ghim {formatDateTime(post.pinnedAt)}</span> : null}
          </div>
          <p className="text-sm text-muted-foreground">
            {post?.authorName} ({post?.authorRole}) · {post?.category} · Tạo {formatDateTime(post?.createdAt)} · ♥ {post?.likeCount ?? 0} · 💬 {post?.commentCount ?? 0}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{renderContent(content)}</p>
          {images?.length ? (
            <div>
              <p className="mb-1 text-sm font-medium">Ảnh (object keys — V2 không trả URL trực tiếp)</p>
              <ul className="list-inside list-disc text-sm text-muted-foreground">
                {images.map((img) => (
                  <li key={img.id}>{img.imageObjectKey}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Bình luận ({commentsQuery.data?.totalElements ?? 0}) — xoá bằng endpoint admin kèm lý do
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {commentsQuery.isLoading ? <p className="text-muted-foreground">Đang tải…</p> : null}
          {commentsQuery.isError ? <p className="text-destructive">{getErrorMessage(commentsQuery.error)}</p> : null}
          {(commentsQuery.data?.content ?? []).map((c) => (
            <div key={c.id} className="flex items-start justify-between gap-3 rounded-md border p-3">
              <div>
                <p className="text-sm">
                  <span className="font-medium">{c.authorName}</span>{" "}
                  <span className="text-xs text-muted-foreground">{formatDateTime(c.createdAt)} · ♥ {c.likeCount ?? 0}</span>
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm">{c.deleted ? <em className="text-muted-foreground">(đã xoá)</em> : c.content}</p>
              </div>
              {!c.deleted ? (
                <Button size="sm" variant="destructive" onClick={() => setCommentToDelete(c)}>
                  Xoá
                </Button>
              ) : null}
            </div>
          ))}
          {(commentsQuery.data?.content ?? []).length === 0 && !commentsQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Chưa có bình luận.</p>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" disabled={commentPage <= 0} onClick={() => setCommentPage((p) => p - 1)}>
              Trước
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={commentPage + 1 >= (commentsQuery.data?.totalPages ?? 0)}
              onClick={() => setCommentPage((p) => p + 1)}
            >
              Sau
            </Button>
          </div>
        </CardContent>
      </Card>

      <ReasonDialog
        open={commentToDelete !== null}
        title="Xoá bình luận (admin)"
        confirmLabel="Xoá bình luận"
        destructive
        isPending={deleteCommentMutation.isPending}
        onClose={() => setCommentToDelete(null)}
        onConfirm={(v) => {
          if (commentToDelete?.id) deleteCommentMutation.mutate({ id: commentToDelete.id, reason: v.reason, description: v.description });
        }}
      />
    </div>
  );
}
export { PostDetailPage };
