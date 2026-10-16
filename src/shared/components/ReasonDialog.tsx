import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "./ui/button";
import { Dialog } from "./ui/dialog";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";

const schema = z.object({
  reason: z.string().min(5, "Lý do tối thiểu 5 ký tự").max(500, "Lý do tối đa 500 ký tự"),
  description: z.string().max(2000, "Mô tả tối đa 2000 ký tự").optional(),
  days: z.number().min(1, "Ít nhất 1 ngày").max(365, "Tối đa 365 ngày").optional(),
});
type FormValues = z.infer<typeof schema>;

type ReasonDialogProps = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  destructive?: boolean;
  /** Show the ban-length field (users ban: 1–365 days). */
  withDays?: boolean;
  isPending?: boolean;
  onClose: () => void;
  onConfirm: (values: { reason: string; description?: string; days?: number }) => void;
};

/**
 * Every V2 moderation action requires a reason (5–500 chars, shown to the user
 * and stored in the audit log) + optional internal description (≤2000).
 * Schemas mirror ModeratePostCommand / ModerationReasonCommand / BanUserCommand.
 */
function ReasonDialog({
  open,
  title,
  description,
  confirmLabel = "Xác nhận",
  destructive,
  withDays,
  isPending,
  onClose,
  onConfirm,
}: ReasonDialogProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { reason: "", description: "", days: 7 },
  });

  useEffect(() => {
    if (open) form.reset({ reason: "", description: "", days: 7 });
  }, [open, form]);

  return (
    <Dialog open={open} onClose={onClose} title={title} description={description}>
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit((v) => onConfirm({ reason: v.reason, description: v.description || undefined, days: withDays ? v.days : undefined }))}
      >
        {withDays ? (
          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="ban-days">
              Số ngày cấm (1–365)
            </label>
            <Input id="ban-days" type="number" min={1} max={365} {...form.register("days", { valueAsNumber: true })} />
            {form.formState.errors.days ? <p className="mt-1 text-sm text-destructive">{form.formState.errors.days.message}</p> : null}
          </div>
        ) : null}
        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="reason">
            Lý do <span className="text-muted-foreground">(hiển thị cho người dùng, lưu vào audit log)</span>
          </label>
          <Textarea id="reason" rows={3} placeholder="VD: Nội dung quảng cáo không được phép" {...form.register("reason")} />
          {form.formState.errors.reason ? <p className="mt-1 text-sm text-destructive">{form.formState.errors.reason.message}</p> : null}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="reason-desc">
            Mô tả nội bộ <span className="text-muted-foreground">(tuỳ chọn, chỉ admin thấy)</span>
          </label>
          <Textarea id="reason-desc" rows={2} {...form.register("description")} />
          {form.formState.errors.description ? (
            <p className="mt-1 text-sm text-destructive">{form.formState.errors.description.message}</p>
          ) : null}
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Huỷ
          </Button>
          <Button type="submit" variant={destructive ? "destructive" : "default"} disabled={isPending}>
            {isPending ? "Đang xử lý…" : confirmLabel}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
export { ReasonDialog };
export type { FormValues as ReasonFormValues };
