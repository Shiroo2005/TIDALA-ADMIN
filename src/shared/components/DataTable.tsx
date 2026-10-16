import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from "@tanstack/react-table";
import { Button } from "./ui/button";

type DataTableProps<T> = {
  columns: ColumnDef<T>[];
  data: T[];
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  emptyMessage?: string;
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

/** Server-paginated table (Spring PageResponse shape) built on TanStack Table, manual pagination mode. */
function DataTable<T>({
  columns,
  data,
  isLoading,
  isError,
  errorMessage,
  emptyMessage = "Không có dữ liệu",
  page,
  size,
  totalElements,
  totalPages,
  onPageChange,
}: DataTableProps<T>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: totalPages,
    state: { pagination: { pageIndex: page, pageSize: size } },
  });

  return (
    <div className="rounded-lg border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="border-b bg-muted/50 text-left">
                {hg.headers.map((h) => (
                  <th key={h.id} className="px-4 py-3 font-medium text-muted-foreground">
                    {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-muted-foreground">
                  <span className="inline-block size-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </td>
              </tr>
            ) : isError ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-destructive">
                  {errorMessage ?? "Không tải được dữ liệu"}
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-muted-foreground">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="border-b last:border-0 hover:bg-muted/40">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3 align-top">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm text-muted-foreground">
        <span>
          Tổng {totalElements} bản ghi · Trang {totalPages === 0 ? 0 : page + 1}/{totalPages}
        </span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page <= 0 || isLoading} onClick={() => onPageChange(page - 1)}>
            Trước
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page + 1 >= totalPages || isLoading}
            onClick={() => onPageChange(page + 1)}
          >
            Sau
          </Button>
        </div>
      </div>
    </div>
  );
}
export { DataTable };
