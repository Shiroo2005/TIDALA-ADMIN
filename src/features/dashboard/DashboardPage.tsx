import { Ban, BookOpen, Flag, Newspaper, ScrollText, Users } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { formatNumber } from "@/shared/utils/format";
import { mockModerationActivity, mockStats, mockUserGrowth } from "./mock";

const CARDS = [
  { label: "Tổng người dùng", value: mockStats.totalUsers, icon: Users },
  { label: "Giáo viên", value: mockStats.totalTeachers, icon: Users },
  { label: "Báo cáo chờ xử lý", value: mockStats.pendingReports, icon: Flag },
  { label: "Bài viết đã đăng", value: mockStats.publishedPosts, icon: Newspaper },
  { label: "Học viên notebook đang học", value: mockStats.notebookStudentsActive, icon: BookOpen },
  { label: "Tài khoản đang bị cấm", value: mockStats.bannedUsers, icon: Ban },
  { label: "Hành động admin hôm nay", value: mockStats.auditActionsToday, icon: ScrollText },
] as const;

function DashboardPage() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Tổng quan</h1>
          <p className="text-sm text-muted-foreground">Số liệu vận hành của Tidala.</p>
        </div>
        <Badge variant="warning">Mock data — V2 chưa có endpoint thống kê</Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {CARDS.map((c) => (
          <Card key={c.label}>
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{c.label}</CardTitle>
              <c.icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(c.value)}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Tăng trưởng người dùng (mock)</CardTitle>
            <CardDescription>Học viên và giáo viên mới theo tháng</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockUserGrowth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="students" name="Học viên" stroke="#2563eb" fill="#93c5fd" />
                <Area type="monotone" dataKey="teachers" name="Giáo viên" stroke="#059669" fill="#6ee7b7" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Hoạt động kiểm duyệt (mock)</CardTitle>
            <CardDescription>Báo cáo đã xử lý / tài khoản bị cấm / nội dung đã xoá theo ngày</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockModerationActivity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="resolved" name="Resolved" fill="#2563eb" />
                <Bar dataKey="banned" name="Banned" fill="#dc2626" />
                <Bar dataKey="deleted" name="Deleted" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
export { DashboardPage };
