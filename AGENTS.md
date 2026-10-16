# AGENTS.md — notes for AI coding agents (OpenCode etc.)

- This is a **standalone** Vite + React 19 + TS admin app for Tidala, API V2
  only. Do not copy code from Tidala_FE's embedded admin without checking the
  endpoint exists in `openapi.json` — most of it targets the old API.
- Types: `src/types/api.d.ts` is GENERATED from `openapi.json`
  (`npm run gen:api`). Never edit it by hand. Use aliases in
  `src/types/domain.ts`, extend those instead.
- All backend calls go through `src/config/axios.ts` (`axiosInstance`).
  Responses are wrapped: `{ message, data, path }`; lists use Spring
  `PageResponse` (`content, page, size, totalElements, totalPages, last`).
  Errors use `{ error_code, message, errors[] }` — snake_case `error_code`.
- Auth invariants (do not weaken): ADMIN role gate at login AND on session
  restore; access token in memory only; refresh token in `sessionStorage`
  only; never localStorage.
- Moderation actions must always collect a reason via `ReasonDialog`
  (min 5 / max 500 chars) — the backend requires it and writes an audit log.
- Lists are server-paginated via the shared `DataTable` (TanStack Table,
  manual pagination). Page size 20 everywhere, matching backend defaults.
- Dashboard data is MOCK (`src/features/dashboard/mock.ts`). Do not present
  it as real; replace the module with a query when a stats endpoint exists.
- Verify before finishing: `npm run build` (runs `tsc -b`) must pass.
