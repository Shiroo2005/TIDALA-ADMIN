/**
 * MOCK DATA for the dashboard.
 * V2 has no stats/overview endpoint (checked against the attached OpenAPI,
 * 2026-10-16), so the dashboard is a design-first feature: numbers below are
 * fabricated and clearly labelled in the UI. When the backend adds a stats
 * endpoint, swap this module for a TanStack Query hook — the page only reads
 * from here.
 */
export const mockStats = {
  totalUsers: 12_480,
  totalTeachers: 1_240,
  totalStudents: 11_120,
  pendingReports: 17,
  publishedPosts: 3_862,
  notebookStudentsActive: 2_914,
  bannedUsers: 23,
  auditActionsToday: 41,
};

export const mockUserGrowth = [
  { month: "T5", students: 820, teachers: 64 },
  { month: "T6", students: 1050, teachers: 82 },
  { month: "T7", students: 1490, teachers: 110 },
  { month: "T8", students: 1980, teachers: 141 },
  { month: "T9", students: 2610, teachers: 176 },
  { month: "T10", students: 3240, teachers: 205 },
];

export const mockModerationActivity = [
  { day: "T2", resolved: 12, banned: 1, deleted: 3 },
  { day: "T3", resolved: 9, banned: 0, deleted: 2 },
  { day: "T4", resolved: 15, banned: 2, deleted: 5 },
  { day: "T5", resolved: 7, banned: 0, deleted: 1 },
  { day: "T6", resolved: 11, banned: 1, deleted: 4 },
  { day: "T7", resolved: 4, banned: 0, deleted: 0 },
  { day: "CN", resolved: 3, banned: 0, deleted: 1 },
];
