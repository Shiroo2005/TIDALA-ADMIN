import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { DataTable } from "@/shared/components/DataTable";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Dialog } from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Select } from "@/shared/components/ui/select";
import { getErrorMessage } from "@/shared/api/api-error";
import { formatDateTime } from "@/shared/utils/format";
import type { AdminAuditLog } from "@/types/domain";
import { getAuditLog, listAuditLogs } from "./audit-logs-api";

const PAGE_SIZE = 20;
const ACTIONS = [
  "POST_STATUS_CHANGED", "POST_PINNED", "POST_UNPINNED", "POST_DELETED", "COMMENT_DELETED",
  "REPORT_RESOLVED", "CREATED", "UPDATED", "DELETED", "BULK_CREATED", "USER_BANNED", "USER_UNBANNED",
] as const;
const TARGET_TYPES = ["POST", "COMMENT", "REPORT", "PROVINCE", "DISTRICT", "TRAINING_LEVEL", "TAG", "USER"] as const;

function AuditLogsPage() {
  const [page, setPage] = useState(0);
  const [action, setAction] = useState("");
  const [targetType, setTargetType] = useState("");
  const [actorId, setActorId] = useState("");
  const [targetId, setTargetId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ["audit-logs", page, action, targetType, actorId, targetId, from, to],
    queryFn: () =>
      listAuditLogs({
        page,
        size: PAGE_SIZE,
        action,
        targetType,
        actorId,
        targetId,
        from: from ? new Date(from).toISOString() : undefined,
        to: to ? new Date(to).toISOString() : undefined,
      }),
  });

  const detailQuery = useQuery({
    queryKey: ["audit-log", selectedId],
    queryFn: () => getAuditLog(selectedId!),
    enabled: Boolean(selectedId),
  });

  const columns = useMemo<ColumnDef<AdminAuditLog>[]>(
    () => [
      { header: "Thời gian", cell: ({ row }) => formatDateTime(row.original.createdAt) },
      { header: "Hành động", cell: ({ row }) => <Badge variant="outline">{row.original.action}</Badge> },
      {
        header: "Đối tượng",
        cell: ({ row }) => (
          <span className="text-xs">
            {row.original.targetType} · <span className="text-muted-foreground">{row.original.targetId}</span>
          </span>
        ),
      },
      { header: "Admin", cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.original.actorId}</span> },
      {
        header: "Lý do",
        cell: ({ row }) => <span className="line-clamp-2 max-w-xs text-xs">{row.original.reason ?? "—"}</span>,
      },
      {
        header: "",
        cell: ({ row }) => (
          <Button size="sm" variant="outline" onClick={() => setSelectedId(row.original.id!)}>
            Chi tiết
          </Button>
        ),
      },
    ],
    [],
  );

  const detail = detailQuery.data;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Audit logs</h1>
        <p className="text-sm text-muted-foreground">Ai đã thay đổi gì, và vì sao. Mới nhất trước; API không nhận sort.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Select className="w-56" value={action} onChange={(e) => { setAction(e.target.value); setPage(0); }}>
          <option value="">Tất cả hành động</option>
          {ACTIONS.map((a) => (<option key={a} value={a}>{a}</option>))}
        </Select>
        <Select className="w-48" value={targetType} onChange={(e) => { setTargetType(e.target.value); setPage(0); }}>
          <option value="">Tất cả đối tượng</option>
          {TARGET_TYPES.map((t) => (<option key={t} value={t}>{t}</option>))}
        </Select>
        <Input className="w-60" placeholder="actorId (UUID)" value={actorId} onChange={(e) => { setActorId(e.target.value.trim()); setPage(0); }} />
        <Input className="w-60" placeholder="targetId (UUID)" value={targetId} onChange={(e) => { setTargetId(e.target.value.trim()); setPage(0); }} />
        <Input className="w-44" type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(0); }} />
        <Input className="w-44" type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(0); }} />
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

      <Dialog open={selectedId !== null} onClose={() => setSelectedId(null)} title="Chi tiết audit log" className="max-w-2xl">
        {detailQuery.isLoading ? <p className="text-muted-foreground">Đang tải…</p> : null}
        {detailQuery.isError ? <p className="text-destructive">{getErrorMessage(detailQuery.error)}</p> : null}
        {detail ? (
          <dl className="space-y-2 break-words text-sm">
            <div><dt className="font-medium">Hành động</dt><dd>{detail.action}</dd></div>
            <div><dt className="font-medium">Đối tượng</dt><dd>{detail.targetType} — {detail.targetId}</dd></div>
            <div><dt className="font-medium">Admin (actorId)</dt><dd>{detail.actorId}</dd></div>
            <div><dt className="font-medium">Lý do</dt><dd>{detail.reason ?? "—"}</dd></div>
            <div><dt className="font-medium">Mô tả nội bộ</dt><dd>{detail.description ?? "—"}</dd></div>
            <div><dt className="font-medium">IP / User-Agent</dt><dd>{detail.ipAddress ?? "—"} · {detail.userAgent ?? "—"}</dd></div>
            <div><dt className="font-medium">Thời gian</dt><dd>{formatDateTime(detail.createdAt)}</dd></div>
            {detail.metadata ? (
              <div>
                <dt className="font-medium">Metadata</dt>
                <dd><pre className="mt-1 overflow-x-auto rounded-md bg-muted p-3 text-xs">{JSON.stringify(detail.metadata, null, 2)}</pre></dd>
              </div>
            ) : null}
          </dl>
        ) : null}
      </Dialog>
    </div>
  );
}
export { AuditLogsPage };
