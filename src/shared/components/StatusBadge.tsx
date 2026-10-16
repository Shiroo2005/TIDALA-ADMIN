import { Badge } from "./ui/badge";

const VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info"> = {
  // users
  ACTIVE: "success",
  INACTIVE: "secondary",
  BANNED: "destructive",
  ADMIN: "default",
  TEACHER: "info",
  STUDENT: "secondary",
  // posts
  PUBLISHED: "success",
  DRAFT: "warning",
  REJECTED: "destructive",
  // reports
  PENDING: "warning",
  RESOLVED: "success",
  DISMISSED: "secondary",
  // notebook students
  PREPARING: "secondary",
  STUDYING: "info",
  WAITING_EXAM: "warning",
  PASSED: "success",
  DROPPED: "destructive",
};

function StatusBadge({ value }: { value?: string | null }) {
  if (!value) return <span className="text-muted-foreground">—</span>;
  return <Badge variant={VARIANTS[value] ?? "outline"}>{value}</Badge>;
}
export { StatusBadge };
