import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { DataTable } from "@/shared/components/DataTable";
import { Button } from "@/shared/components/ui/button";
import { Dialog } from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Select } from "@/shared/components/ui/select";
import { Textarea } from "@/shared/components/ui/textarea";
import { getErrorMessage } from "@/shared/api/api-error";
import type { District, Province, TagItem, TrainingLevel } from "@/types/domain";
import {
  bulkCreateProvinces,
  bulkCreateTrainingLevels,
  createDistrict,
  createProvince,
  createTag,
  createTrainingLevel,
  deleteDistrict,
  deleteProvince,
  deleteTag,
  deleteTrainingLevel,
  listDistricts,
  listProvinces,
  listTags,
  listTrainingLevels,
  updateDistrict,
  updateProvince,
  updateTag,
  updateTrainingLevel,
} from "./catalog-api";

const PAGE_SIZE = 20;
type Tab = "provinces" | "districts" | "tags" | "levels";
type EditState =
  | { tab: Tab; mode: "create" }
  | { tab: Tab; mode: "edit"; id: string; values: Record<string, string> }
  | null;

const TAB_LABELS: Record<Tab, string> = {
  provinces: "Tỉnh / thành",
  districts: "Quận / huyện / phường",
  tags: "Tags",
  levels: "Hạng đào tạo",
};

function CatalogPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("provinces");
  const [page, setPage] = useState(0);
  const [q, setQ] = useState("");
  const [tagType, setTagType] = useState("");
  const [provinceFilter, setProvinceFilter] = useState("");
  const [edit, setEdit] = useState<EditState>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkJson, setBulkJson] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["catalog"] });
  const fail = (e: unknown) => toast.error(getErrorMessage(e));

  const provincesQuery = useQuery({
    queryKey: ["catalog", "provinces", page, q],
    queryFn: () => listProvinces(page, PAGE_SIZE, q),
    enabled: tab === "provinces",
  });
  const districtsQuery = useQuery({
    queryKey: ["catalog", "districts", page, q, provinceFilter],
    queryFn: () => listDistricts(page, PAGE_SIZE, q, provinceFilter),
    enabled: tab === "districts",
  });
  const tagsQuery = useQuery({
    queryKey: ["catalog", "tags", page, q, tagType],
    queryFn: () => listTags(page, PAGE_SIZE, q, tagType),
    enabled: tab === "tags",
  });
  const levelsQuery = useQuery({
    queryKey: ["catalog", "levels", page, q],
    queryFn: () => listTrainingLevels(page, PAGE_SIZE, q),
    enabled: tab === "levels",
  });
  const allProvinces = useQuery({
    queryKey: ["catalog", "provinces-all"],
    queryFn: () => listProvinces(0, 200),
    enabled: tab === "districts",
  });

  const saveMutation = useMutation({
    mutationFn: async (v: { tab: Tab; mode: "create" | "edit"; id?: string; values: Record<string, string> }) => {
      const name = v.values.name?.trim();
      const description = v.values.description?.trim() || undefined;
      if (v.tab === "provinces") {
        if (v.mode === "create") await createProvince({ name, description });
        else await updateProvince(v.id!, { name, description });
      } else if (v.tab === "districts") {
        const body = { name, description, provinceId: v.values.provinceId };
        if (v.mode === "create") await createDistrict(body);
        else await updateDistrict(v.id!, body);
      } else if (v.tab === "tags") {
        const body = { name, type: v.values.type as "SPECIALTY" | "STYLE" };
        if (v.mode === "create") await createTag(body);
        else await updateTag(v.id!, body);
      } else {
        let progressTemplate: unknown;
        if (v.values.progressTemplate?.trim()) {
          try {
            progressTemplate = JSON.parse(v.values.progressTemplate);
          } catch {
            throw new Error("progressTemplate không phải JSON hợp lệ");
          }
        }
        const body = {
          name,
          description,
          orderPosition: v.values.orderPosition ? Number(v.values.orderPosition) : undefined,
          progressTemplate: progressTemplate as never,
        };
        if (v.mode === "create") await createTrainingLevel(body);
        else await updateTrainingLevel(v.id!, body);
      }
    },
    onSuccess: () => {
      toast.success("Đã lưu");
      setEdit(null);
      invalidate();
    },
    onError: fail,
  });

  const deleteMutation = useMutation({
    mutationFn: async (v: { tab: Tab; id: string }) => {
      if (v.tab === "provinces") await deleteProvince(v.id);
      else if (v.tab === "districts") await deleteDistrict(v.id);
      else if (v.tab === "tags") await deleteTag(v.id);
      else await deleteTrainingLevel(v.id);
    },
    onSuccess: () => {
      toast.success("Đã xoá");
      setDeleteTarget(null);
      invalidate();
    },
    onError: fail,
  });

  const bulkMutation = useMutation({
    mutationFn: async () => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(bulkJson);
      } catch {
        throw new Error("JSON không hợp lệ");
      }
      if (!Array.isArray(parsed)) throw new Error("Bulk payload phải là một mảng JSON");
      if (tab === "provinces") await bulkCreateProvinces(parsed as { name: string; districts?: { name: string }[] }[]);
      else await bulkCreateTrainingLevels(parsed as { name: string; description?: string; orderPosition?: number }[]);
    },
    onSuccess: () => {
      toast.success("Đã tạo hàng loạt");
      setBulkOpen(false);
      setBulkJson("");
      invalidate();
    },
    onError: fail,
  });

  const actions = (id: string, name: string, values: Record<string, string>) => (
    <div className="flex gap-1">
      <Button size="sm" variant="outline" onClick={() => setEdit({ tab, mode: "edit", id, values })}>
        Sửa
      </Button>
      <Button size="sm" variant="destructive" onClick={() => setDeleteTarget({ id, name })}>
        Xoá
      </Button>
    </div>
  );

  const provinceColumns = useMemo<ColumnDef<Province>[]>(
    () => [
      { header: "Tên", cell: ({ row }) => <span className="font-medium">{row.original.name}</span> },
      { header: "Slug", cell: ({ row }) => <span className="text-muted-foreground">{row.original.slug}</span> },
      { header: "Mô tả", cell: ({ row }) => <span className="line-clamp-2 max-w-sm text-xs">{row.original.description ?? "—"}</span> },
      { header: "Thao tác", cell: ({ row }) => actions(row.original.id!, row.original.name!, { name: row.original.name ?? "", description: row.original.description ?? "" }) },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tab],
  );
  const districtColumns = useMemo<ColumnDef<District>[]>(
    () => [
      { header: "Tên", cell: ({ row }) => <span className="font-medium">{row.original.name}</span> },
      { header: "Slug", cell: ({ row }) => <span className="text-muted-foreground">{row.original.slug}</span> },
      { header: "Province ID", cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.original.provinceId}</span> },
      { header: "Thao tác", cell: ({ row }) => actions(row.original.id!, row.original.name!, { name: row.original.name ?? "", description: row.original.description ?? "", provinceId: row.original.provinceId ?? "" }) },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tab],
  );
  const tagColumns = useMemo<ColumnDef<TagItem>[]>(
    () => [
      {
        header: "Tên",
        cell: ({ row }) => (
          <span
            className="inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold"
            style={{ color: row.original.textColor, backgroundColor: row.original.backgroundColor, borderColor: row.original.borderColor }}
          >
            {row.original.name}
          </span>
        ),
      },
      { header: "Loại", cell: ({ row }) => row.original.type },
      { header: "Slug", cell: ({ row }) => <span className="text-muted-foreground">{row.original.slug}</span> },
      { header: "Thao tác", cell: ({ row }) => actions(row.original.id!, row.original.name!, { name: row.original.name ?? "", type: row.original.type ?? "SPECIALTY" }) },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tab],
  );
  const levelColumns = useMemo<ColumnDef<TrainingLevel>[]>(
    () => [
      { header: "Thứ tự", cell: ({ row }) => row.original.orderPosition ?? "—" },
      { header: "Tên", cell: ({ row }) => <span className="font-medium">{row.original.name}</span> },
      { header: "Slug", cell: ({ row }) => <span className="text-muted-foreground">{row.original.slug}</span> },
      { header: "Mô tả", cell: ({ row }) => <span className="line-clamp-2 max-w-sm text-xs">{row.original.description ?? "—"}</span> },
      { header: "Template", cell: ({ row }) => (row.original.progressTemplate ? "Tuỳ chỉnh" : "Mặc định") },
      {
        header: "Thao tác",
        cell: ({ row }) =>
          actions(row.original.id!, row.original.name!, {
            name: row.original.name ?? "",
            description: row.original.description ?? "",
            orderPosition: String(row.original.orderPosition ?? ""),
            progressTemplate: row.original.progressTemplate ? JSON.stringify(row.original.progressTemplate, null, 2) : "",
          }),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tab],
  );

  const active =
    tab === "provinces" ? provincesQuery : tab === "districts" ? districtsQuery : tab === "tags" ? tagsQuery : levelsQuery;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">Danh mục (Catalog)</h1>
          <p className="text-sm text-muted-foreground">
            Endpoint catalog không nằm dưới /admin trong V2 — quyền ghi phụ thuộc backend guard theo role ADMIN.
          </p>
        </div>
        <div className="flex gap-2">
          {(tab === "provinces" || tab === "levels") && (
            <Button variant="outline" onClick={() => setBulkOpen(true)}>
              Tạo hàng loạt (JSON)
            </Button>
          )}
          <Button onClick={() => setEdit({ tab, mode: "create" })}>Thêm mới</Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 border-b">
        {(Object.keys(TAB_LABELS) as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => {
              setTab(t);
              setPage(0);
            }}
            className={`px-3 py-2 text-sm font-medium ${tab === t ? "border-b-2 border-primary text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <Input className="w-64" placeholder="Tìm kiếm (q)…" value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} />
        {tab === "tags" ? (
          <Select className="w-48" value={tagType} onChange={(e) => { setTagType(e.target.value); setPage(0); }}>
            <option value="">Tất cả loại</option>
            <option value="SPECIALTY">SPECIALTY</option>
            <option value="STYLE">STYLE</option>
          </Select>
        ) : null}
        {tab === "districts" ? (
          <Select className="w-64" value={provinceFilter} onChange={(e) => { setProvinceFilter(e.target.value); setPage(0); }}>
            <option value="">Tất cả tỉnh/thành</option>
            {(allProvinces.data?.content ?? []).map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </Select>
        ) : null}
      </div>

      {tab === "provinces" ? (
        <DataTable columns={provinceColumns} data={provincesQuery.data?.content ?? []} isLoading={active.isLoading} isError={active.isError} errorMessage={active.error ? getErrorMessage(active.error) : undefined} page={page} size={PAGE_SIZE} totalElements={provincesQuery.data?.totalElements ?? 0} totalPages={provincesQuery.data?.totalPages ?? 0} onPageChange={setPage} />
      ) : tab === "districts" ? (
        <DataTable columns={districtColumns} data={districtsQuery.data?.content ?? []} isLoading={active.isLoading} isError={active.isError} errorMessage={active.error ? getErrorMessage(active.error) : undefined} page={page} size={PAGE_SIZE} totalElements={districtsQuery.data?.totalElements ?? 0} totalPages={districtsQuery.data?.totalPages ?? 0} onPageChange={setPage} />
      ) : tab === "tags" ? (
        <DataTable columns={tagColumns} data={tagsQuery.data?.content ?? []} isLoading={active.isLoading} isError={active.isError} errorMessage={active.error ? getErrorMessage(active.error) : undefined} page={page} size={PAGE_SIZE} totalElements={tagsQuery.data?.totalElements ?? 0} totalPages={tagsQuery.data?.totalPages ?? 0} onPageChange={setPage} />
      ) : (
        <DataTable columns={levelColumns} data={levelsQuery.data?.content ?? []} isLoading={active.isLoading} isError={active.isError} errorMessage={active.error ? getErrorMessage(active.error) : undefined} page={page} size={PAGE_SIZE} totalElements={levelsQuery.data?.totalElements ?? 0} totalPages={levelsQuery.data?.totalPages ?? 0} onPageChange={setPage} />
      )}

      <CatalogFormDialog
        edit={edit}
        provinces={allProvinces.data?.content ?? []}
        isPending={saveMutation.isPending}
        onClose={() => setEdit(null)}
        onSubmit={(values) => {
          if (!edit) return;
          saveMutation.mutate({ tab: edit.tab, mode: edit.mode, id: edit.mode === "edit" ? edit.id : undefined, values });
        }}
      />

      <Dialog open={bulkOpen} onClose={() => setBulkOpen(false)} title={`Tạo hàng loạt — ${TAB_LABELS[tab]}`} className="max-w-2xl">
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {tab === "provinces"
              ? 'Dán mảng JSON: [{"name":"Đà Nẵng","districts":[{"name":"Hải Châu"}]}]'
              : 'Dán mảng JSON: [{"name":"Hạng B2","description":"...","orderPosition":1}]'}
          </p>
          <Textarea rows={10} className="font-mono text-xs" value={bulkJson} onChange={(e) => setBulkJson(e.target.value)} />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setBulkOpen(false)}>Huỷ</Button>
            <Button disabled={bulkMutation.isPending || !bulkJson.trim()} onClick={() => bulkMutation.mutate()}>
              {bulkMutation.isPending ? "Đang tạo…" : "Tạo"}
            </Button>
          </div>
        </div>
      </Dialog>

      <Dialog open={deleteTarget !== null} onClose={() => setDeleteTarget(null)} title="Xoá mục danh mục?">
        <div className="space-y-4 text-sm">
          <p>
            Xoá <strong>{deleteTarget?.name}</strong> khỏi {TAB_LABELS[tab]}? Hành động này được ghi vào audit log phía backend (nếu có).
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Huỷ</Button>
            <Button variant="destructive" disabled={deleteMutation.isPending} onClick={() => deleteTarget && deleteMutation.mutate({ tab, id: deleteTarget.id })}>
              Xoá
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

function CatalogFormDialog({
  edit,
  provinces,
  isPending,
  onClose,
  onSubmit,
}: {
  edit: EditState;
  provinces: Province[];
  isPending?: boolean;
  onClose: () => void;
  onSubmit: (values: Record<string, string>) => void;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  // Reset the form whenever a new edit target opens.
  const editKey = edit ? `${edit.tab}-${edit.mode}-${edit.mode === "edit" ? edit.id : "new"}` : "closed";
  const [lastKey, setLastKey] = useState(editKey);
  if (editKey !== lastKey) {
    setLastKey(editKey);
    setValues(edit?.mode === "edit" ? edit.values : {});
  }
  if (!edit) return null;
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setValues((v) => ({ ...v, [k]: e.target.value }));

  return (
    <Dialog open onClose={onClose} title={`${edit.mode === "create" ? "Thêm" : "Sửa"} — ${TAB_LABELS[edit.tab]}`} className="max-w-2xl">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(values);
        }}
      >
        <div>
          <label className="mb-1 block text-sm font-medium">Tên *</label>
          <Input required maxLength={150} value={values.name ?? ""} onChange={set("name")} />
        </div>
        {edit.tab === "districts" ? (
          <div>
            <label className="mb-1 block text-sm font-medium">Tỉnh / thành *</label>
            <Select required value={values.provinceId ?? ""} onChange={set("provinceId")}>
              <option value="" disabled>Chọn tỉnh/thành</option>
              {provinces.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </Select>
            {provinces.length === 0 ? <p className="mt-1 text-xs text-muted-foreground">Chưa tải được danh sách tỉnh — mở tab Quận/huyện một lần để nạp, hoặc dán UUID vào sau.</p> : null}
          </div>
        ) : null}
        {edit.tab === "tags" ? (
          <div>
            <label className="mb-1 block text-sm font-medium">Loại *</label>
            <Select required value={values.type ?? "SPECIALTY"} onChange={set("type")}>
              <option value="SPECIALTY">SPECIALTY</option>
              <option value="STYLE">STYLE</option>
            </Select>
          </div>
        ) : null}
        {edit.tab !== "tags" ? (
          <div>
            <label className="mb-1 block text-sm font-medium">Mô tả</label>
            <Textarea rows={3} maxLength={2000} value={values.description ?? ""} onChange={set("description")} />
          </div>
        ) : null}
        {edit.tab === "levels" ? (
          <>
            <div>
              <label className="mb-1 block text-sm font-medium">Thứ tự hiển thị</label>
              <Input type="number" min={0} value={values.orderPosition ?? ""} onChange={set("orderPosition")} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">progressTemplate (JSON, tuỳ chọn — để trống = dùng mặc định của backend)</label>
              <Textarea rows={8} className="font-mono text-xs" value={values.progressTemplate ?? ""} onChange={set("progressTemplate")} />
            </div>
          </>
        ) : null}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Huỷ</Button>
          <Button type="submit" disabled={isPending}>{isPending ? "Đang lưu…" : "Lưu"}</Button>
        </div>
      </form>
    </Dialog>
  );
}
export { CatalogPage };
