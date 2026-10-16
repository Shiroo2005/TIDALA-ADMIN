import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { DataTable } from "@/shared/components/DataTable";
import { ReasonDialog } from "@/shared/components/ReasonDialog";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Select } from "@/shared/components/ui/select";
import { getErrorMessage } from "@/shared/api/api-error";
import { formatDateTime } from "@/shared/utils/format";
import type { AdminUser, Role } from "@/types/domain";
import { banUser, listUsers, unbanUser } from "./users-api";

const PAGE_SIZE = 20;
type DialogState = { kind: "ban" | "unban"; user: AdminUser } | null;

function UsersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [keyword, setKeyword] = useState("");
  const [role, setRole] = useState<Role | "">("");
  const [bannedOnly, setBannedOnly] = useState(false);
  const [dialog, setDialog] = useState<DialogState>(null);

  const query = useQuery({
    queryKey: ["admin-users", page, keyword, role, bannedOnly],
    queryFn: () => listUsers({ page, size: PAGE_SIZE, keyword, role: role || undefined, banned: bannedOnly }),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin-users"] });

  const banMutation = useMutation({
    mutationFn: (v: { id: string; days: number; reason: string; description?: string }) =>
      banUser(v.id, { days: v.days, reason: v.reason, description: v.description }),
    onSuccess: () => {
      toast.success("Đã cấm người dùng");
      setDialog(null);
      invalidate();
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const unbanMutation = useMutation({
    mutationFn: (v: { id: string; reason: string; description?: string }) =>
      unbanUser(v.id, { reason: v.reason, description: v.description }),
    onSuccess: () => {
      toast.success("Đã gỡ cấm người dùng");
      setDialog(null);
      invalidate();
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const columns = useMemo<ColumnDef<AdminUser>[]>(
    () => [
      {
        header: "Người dùng",
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            {row.original.avatarUrl ? (
              <img src={row.original.avatarUrl} alt="" className="size-9 rounded-full object-cover" />
            ) : (
              <div className="flex size-9 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                {(row.original.fullName ?? "?").slice(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <div className="font-medium">{row.original.fullName}</div>
              <div className="text-xs text-muted-foreground">{row.original.email ?? "—"} · {row.original.phoneNumber ?? "—"}</div>
            </div>
          </div>
        ),
      },
      { header: "Vai trò", cell: ({ row }) => <StatusBadge value={row.original.role} /> },
      { header: "Trạng thái", cell: ({ row }) => <StatusBadge value={row.original.status} /> },
      {
        header: "Cấm",
        cell: ({ row }) =>
          row.original.banned ? (
            <div>
              <StatusBadge value="BANNED" />
              <div className="mt-1 text-xs text-muted-foreground">
                Đến {formatDateTime(row.original.bannedUntil)} — {row.original.banReason ?? ""}
              </div>
            </div>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      { header: "Ngày tạo", cell: ({ row }) => formatDateTime(row.original.createdAt) },
      {
        header: "Thao tác",
        cell: ({ row }) =>
          row.original.banned ? (
            <Button size="sm" variant="outline" onClick={() => setDialog({ kind: "unban", user: row.original })}>
              Gỡ cấm
            </Button>
          ) : (
            <Button size="sm" variant="destructive" onClick={() => setDialog({ kind: "ban", user: row.original })}>
              Cấm
            </Button>
          ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Người dùng</h1>
        <p className="text-sm text-muted-foreground">Danh sách tài khoản theo vai trò; cấm / gỡ cấm đều ghi audit log.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Input
          className="w-64"
          placeholder="Tìm theo tên, email, SĐT…"
          value={keyword}
          onChange={(e) => {
            setKeyword(e.target.value);
            setPage(0);
          }}
        />
        <Select
          className="w-44"
          value={role}
          onChange={(e) => {
            setRole(e.target.value as Role | "");
            setPage(0);
          }}
        >
          <option value="">Tất cả vai trò</option>
          <option value="STUDENT">STUDENT</option>
          <option value="TEACHER">TEACHER</option>
          <option value="ADMIN">ADMIN</option>
        </Select>
        <Select
          className="w-44"
          value={bannedOnly ? "banned" : "all"}
          onChange={(e) => {
            setBannedOnly(e.target.value === "banned");
            setPage(0);
          }}
        >
          <option value="all">Tất cả</option>
          <option value="banned">Đang bị cấm</option>
        </Select>
      </div>

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
        open={dialog !== null}
        title={dialog?.kind === "ban" ? `Cấm ${dialog.user.fullName ?? ""}` : `Gỡ cấm ${dialog?.user.fullName ?? ""}`}
        description={dialog?.kind === "ban" ? "Tài khoản bị cấm đăng nhập trong thời gian chọn." : undefined}
        confirmLabel={dialog?.kind === "ban" ? "Cấm người dùng" : "Gỡ cấm"}
        destructive={dialog?.kind === "ban"}
        withDays={dialog?.kind === "ban"}
        isPending={banMutation.isPending || unbanMutation.isPending}
        onClose={() => setDialog(null)}
        onConfirm={(v) => {
          if (!dialog) return;
          if (dialog.kind === "ban") {
            if (!v.days) return;
            banMutation.mutate({ id: dialog.user.id!, days: v.days, reason: v.reason, description: v.description });
          } else {
            unbanMutation.mutate({ id: dialog.user.id!, reason: v.reason, description: v.description });
          }
        }}
      />
    </div>
  );
}
export { UsersPage };
