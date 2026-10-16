# Tidala Admin

Standalone admin console for **Tidala**, extracted as a separate project from
[`Shiroo2005/Tidala_FE`](https://github.com/Shiroo2005/Tidala_FE) and re-scoped
to the **TIDALA_API_V2** backend (OpenAPI docs: `openapi.json` in this repo,
server `https://dev-v2-api.tidala.vn`).

> Why separate? The user FE embeds an admin under `/quan-tri`, but it was built
> against the old API. This project reuses the FE's stack and conventions and
> implements only what the V2 API actually serves — plus a mock dashboard.

## Stack

Same as Tidala_FE, stripped of user-facing extras (no PWA, MUI, EditorJS,
STOMP, lightbox):

- Vite + React 19 + TypeScript 5.9
- Tailwind CSS 4 + shadcn-style UI (`base-nova`, neutral) — primitives in
  `src/shared/components/ui` (native `<select>`/custom Dialog on purpose: no
  Radix dependency for an internal tool)
- React Router 7, TanStack Query 5, TanStack Table 8 (server pagination)
- axios with auth + single-flight refresh interceptors (`src/config/axios.ts`,
  same shape as the FE's)
- react-hook-form + zod, sonner toasts, lucide icons, recharts (dashboard only)

## Run

```bash
cp .env.example .env   # VITE_BE_API_URL, no /api/v1 suffix
npm install
npm run dev            # http://localhost:5174
npm run build          # tsc -b && vite build
npm run gen:api        # regenerate src/types/api.d.ts from openapi.json
```

Login requires an account whose `role` is `ADMIN`; non-admin logins are
rejected and never persisted.

## Auth & token storage

- Access token: **in-memory only**. Refresh token: **sessionStorage**
  (tab-scoped) — a deliberate upgrade over the FE's localStorage pattern.
- On load, the session is restored by calling `GET /auth/me` (the axios
  interceptor refreshes on 401 with a shared single-flight promise) and the
  role is re-checked server-side.
- Backend note: refresh-token rotation has **no grace window** in V2 — a lost
  refresh response triggers reuse detection and revokes the whole token
  family. The single-flight interceptor reduces, but cannot eliminate, that
  risk; see the V2 concurrency audit (C4).

## Modules → API map

| Route | Module | Endpoints |
|---|---|---|
| `/` | Dashboard | **Mock data only** — V2 has no stats endpoint (`src/features/dashboard/mock.ts`) |
| `/users` | Admin users | `GET /admin/users`, `POST /admin/users/{id}/ban` (1–365 days), `POST /admin/users/{id}/unban` |
| `/posts`, `/posts/:id` | Post moderation + comments | `GET /admin/posts`, `GET /admin/posts/{id}`, `PUT .../status` (DRAFT/REJECTED only), `PUT/DELETE .../pin`, `POST .../delete`, `GET /posts/{id}/comments`, `POST /admin/comments/{id}/delete` |
| `/reports` | Reports | `GET /reports`, `GET /reports/{id}`, `PUT /reports/{id}/resolve` (targets: TEACHER, REVIEW) |
| `/notebook/students` | Notebook students | `GET /admin/notebook/students` (read-only) |
| `/catalog` | Provinces / Districts / Tags / Training levels | CRUD + `POST /provinces/bulk`, `POST /training-levels/bulk`; training-level `progressTemplate` JSON editor |
| `/audit-logs` | Audit logs | `GET /admin/audit-logs`, `GET /admin/audit-logs/{id}` |

Every moderation action sends a **reason** (5–500 chars, shown to the user,
stored in the audit log) + optional internal description (≤2000) via the
shared `ReasonDialog`.

## Known API gaps (do not "fix" in the FE)

- No stats endpoint → dashboard is mock until the backend adds one.
- No admin teacher management (list/detail/edit/invite) and no endpoint to
  fetch a reported teacher/review by id for moderation context.
- Catalog write endpoints are **not** under `/admin`; this app assumes the
  backend guards them by role. Verify a STUDENT token gets 403 before launch.
- Post detail returns image **object keys**, not URLs — no public URL resolver
  is defined in V2 yet.
- CORS: the deployed admin origin must be allow-listed on the API
  (deployment is handled separately).

## Layout

```
src/
  app/         # entry (main.tsx, App.tsx providers)
  config/      # axios instance + interceptors
  features/    # auth, dashboard, users, posts, reports, notebook, catalog, audit-logs
               # each feature: *-api.ts (axios calls) + Page components
  routes/      # router + RequireAdmin guard (mirrors FE's AdminRoute)
  shared/      # components/ui (shadcn-style), DataTable, ReasonDialog, utils
  types/       # api.d.ts (generated, do not edit) + domain.ts (aliases)
openapi.json   # source of truth for the API contract (attached 2026-10-16)
```
