import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { DataTable } from "@/shared/components/DataTable";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { Button } from "@/shared/components/ui/button";
import { Dialog } from "@/shared/components/ui/dialog";
import { Select } from "@/shared/components/ui/select";
import { Textarea } from "@/shared/components/ui/textarea";
import { getErrorMessage } from "@/shared/api/api-error";
import { formatDateTime } from "@/shared/utils/format";
import type { ReportItem } from "@/types/domain";
import { listReports, resolveReport } from "./reports-api";

const PAGE_SIZE = 20;

function ReportsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [status, setStatus] = useState<"" | "PENDING" | "RESOLVED" | "DISMISSED">("PENDING");
  const [targetType, setTargetType] = useState<"" | "TEACHER" | "REVIEW">("");
  const [selected, setSelected] = useState<ReportItem | null>(null);
  const [outcome, setOutcome] = useState<"RESOLVED" | "DISMISSED">("RESOLVED");
  const [note, setNote] = useState("");

  const query = useQuery({
    queryKey: ["reports", page, status, targetType],
    queryFn: () => listReports({ page, size: PAGE_SIZE, status: status || undefined, targetType: targetType || undefined }),
  });

  const resolveMutation = useMutation({
    mutationFn: (v: { id: string; outcome: "RESOLVED" | "DISMISSED"; note?: string }) =>
      resolveReport(v.id, { outcome: v.outcome, note: v.note }),
    onSuccess: () => {
      toast.success("Đã xử lý báo cáo");
      setSelected(null);
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const columns = useMemo<ColumnDef<ReportItem>[]>(
    () => [
      {
        header: "Báo cáo",
        cell: ({ row }) => (
          <div className="max-w-md">
            <div className="font-medium">
              {row.original.targetType} · {row.original.reason}
            </div>
            <div className="line-clamp-2 text-xs text-muted-foreground">{row.original.detail ?? "—"}</div>
            <div className="mt-1 text-xs text-muted-foreground">
              Người báo cáo: {row.original.reporterEmail ?? row.original.reporterId} · Target ID: {row.original.targetId}
            </div>
          </div>
        ),
      },
      { header: "Trạng thái", cell: ({ row }) => <StatusBadge value={row.original.status} /> },
      { header: "Ngày tạo", cell: ({ row }) => formatDateTime(row.original.createdAt) },
      {
        header: "Đã xử lý",
        cell: ({ row }) =>
          row.original.resolvedAt ? (
            <span className="text-xs">
              {formatDateTime(row.original.resolvedAt)}
              <br />
              <span className="text-muted-foreground">{row.original.resolutionNote ?? ""}</span>
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        header: "Thao tác",
        cell: ({ row }) =>
          row.original.status === "PENDING" ? (
            <Button
              size="sm"
              onClick={() => {
                setSelected(row.original);
                setOutcome("RESOLVED");
                setNote("");
              }}
            >
              Xử lý
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={() => setSelected(row.original)}>
              Xem
            </Button>
          ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Báo cáo vi phạm</h1>
        <p className="text-sm text-muted-foreground">
          Target chỉ gồm TEACHER và REVIEW. Lưu ý: V2 chưa có endpoint admin để mở trực tiếp teacher/review bị báo cáo — dùng Target ID để tra ở app chính.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Select className="w-48" value={status} onChange={(e) => { setStatus(e.target.value as typeof status); setPage(0); }}>
          <option value="">Tất cả trạng thái</option>
          <option value="PENDING">PENDING</option>
          <option value="RESOLVED">RESOLVED</option>
          <option value="DISMISSED">DISMISSED</option>
        </Select>
        <Select className="w-48" value={targetType} onChange={(e) => { setTargetType(e.target.value as typeof targetType); setPage(0); }}>
          <option value="">Tất cả loại</option>
          <option value="TEACHER">TEACHER</option>
          <option value="REVIEW">REVIEW</option>
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

      <Dialog open={selected !== null} onClose={() => setSelected(null)} title="Chi tiết báo cáo">
        {selected ? (
          <div className="space-y-4 text-sm">
            <dl className="space-y-1">
              <div><dt className="inline font-medium">Target: </dt><dd className="inline">{selected.targetType} — {selected.targetId}</dd></div>
              <div><dt className="inline font-medium">Lý do: </dt><dd className="inline">{selected.reason}</dd></div>
              <div><dt className="inline font-medium">Chi tiết: </dt><dd className="inline">{selected.detail ?? "—"}</dd></div>
              <div><dt className="inline font-medium">Người báo cáo: </dt><dd className="inline">{selected.reporterEmail ?? selected.reporterId}</dd></div>
              <div><dt className="inline font-medium">Trạng thái: </dt><dd className="inline">{selected.status}</dd></div>
            </dl>
            {selected.status === "PENDING" ? (
              <>
                <div>
                  <label className="mb-1 block font-medium">Kết quả xử lý</label>
                  <Select value={outcome} onChange={(e) => setOutcome(e.target.value as "RESOLVED" | "DISMISSED")}>
                    <option value="RESOLVED">RESOLVED — báo cáo đúng, đã xử lý</option>
                    <option value="DISMISSED">DISMISSED — báo cáo không hợp lệ</option>
                  </Select>
                </div>
                <div>
                  <label className="mb-1 block font-medium">Ghi chú (tuỳ chọn, ≤1000 ký tự)</label>
                  <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setSelected(null)}>Huỷ</Button>
                  <Button
                    disabled={resolveMutation.isPending}
                    onClick={() => resolveMutation.mutate({ id: selected.id!, outcome, note: note || undefined })}
                  >
                    {resolveMutation.isPending ? "Đang xử lý…" : "Xác nhận xử lý"}
                  </Button>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground">
                Đã xử lý {formatDateTime(selected.resolvedAt)} — {selected.resolutionNote ?? "không có ghi chú"}
              </p>
            )}
          </div>
        ) : null}
      </Dialog>
    </div>
  );
}
export { ReportsPage };
