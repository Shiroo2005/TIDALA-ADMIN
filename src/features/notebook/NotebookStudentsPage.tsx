import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { DataTable } from "@/shared/components/DataTable";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { Input } from "@/shared/components/ui/input";
import { Select } from "@/shared/components/ui/select";
import { getErrorMessage } from "@/shared/api/api-error";
import { formatNumber, formatVND } from "@/shared/utils/format";
import type { NotebookStudent } from "@/types/domain";
import { listNotebookStudents } from "./notebook-api";

const PAGE_SIZE = 20;
const STATUSES = ["PREPARING", "STUDYING", "WAITING_EXAM", "PASSED", "DROPPED"] as const;

function NotebookStudentsPage() {
  const [page, setPage] = useState(0);
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState("");
  const [teacherUserId, setTeacherUserId] = useState("");
  const [courseId, setCourseId] = useState("");

  const query = useQuery({
    queryKey: ["admin-notebook-students", page, keyword, status, teacherUserId, courseId],
    queryFn: () => listNotebookStudents({ page, size: PAGE_SIZE, keyword, status, teacherUserId, courseId }),
  });

  const columns = useMemo<ColumnDef<NotebookStudent>[]>(
    () => [
      {
        header: "Học viên",
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
              <div className="text-xs text-muted-foreground">{row.original.phoneNumber ?? "—"}</div>
            </div>
          </div>
        ),
      },
      {
        header: "Khoá học",
        cell: ({ row }) => (
          <span className="text-xs">
            Course: {row.original.course?.id ?? "—"}
            <br />
            <span className="text-muted-foreground">Teacher: {row.original.teacherUserId}</span>
          </span>
        ),
      },
      { header: "Trạng thái", cell: ({ row }) => <StatusBadge value={row.original.status} /> },
      {
        header: "Học phí",
        cell: ({ row }) => (
          <span className="text-xs">
            Tổng {formatVND(row.original.totalFee)}
            <br />
            Đã đóng {formatVND(row.original.paidAmount)} · Còn nợ{" "}
            <span className={row.original.owedAmount ? "font-medium text-destructive" : ""}>{formatVND(row.original.owedAmount)}</span>
            {row.original.overpaid ? " · Thừa" : ""}
          </span>
        ),
      },
      {
        header: "Tiến độ",
        cell: ({ row }) => (
          <span className="text-xs">
            {formatNumber(row.original.totalMinutes)} phút · {row.original.totalKm ?? 0} km
            <br />
            <span className="text-muted-foreground">Stage tiếp: {row.original.nextSessionStageCode ?? "—"}</span>
          </span>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Học viên Notebook (toàn hệ thống)</h1>
        <p className="text-sm text-muted-foreground">Chỉ đọc — V2 chỉ có endpoint list cho admin ở module này.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Input className="w-56" placeholder="Tìm học viên…" value={keyword} onChange={(e) => { setKeyword(e.target.value); setPage(0); }} />
        <Select className="w-48" value={status} onChange={(e) => { setStatus(e.target.value); setPage(0); }}>
          <option value="">Tất cả trạng thái</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </Select>
        <Input className="w-64" placeholder="teacherUserId (UUID)" value={teacherUserId} onChange={(e) => { setTeacherUserId(e.target.value.trim()); setPage(0); }} />
        <Input className="w-64" placeholder="courseId (UUID)" value={courseId} onChange={(e) => { setCourseId(e.target.value.trim()); setPage(0); }} />
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
    </div>
  );
}
export { NotebookStudentsPage };
