# `apps/web` — Tcharts Next.js 15 frontend

Production deployable: `tcharts-web` ECS service (Node server, not static).

## Stack
- Next.js 15 App Router + TypeScript
- Tailwind CSS + `@tcharts/ui` design tokens
- TanStack Query (client state)
- Zustand (UI state — sidebar, modals)
- React Hook Form + Zod (forms — wired in S1+)

## Server vs client component policy
See [`docs/adr/0001-frontend-nextjs-override.md`](../../docs/adr/0001-frontend-nextjs-override.md) §Consequences.

Short version:
- Server (default): layouts, route-level auth gates, read-only initial paint.
- Client (`'use client'`): forms, tables with filters, anything using TanStack Query, Socket.IO, Zustand, React Hook Form.
- **No server actions for accounting mutations.** All mutations go through the typed API client → NestJS API at `api.tcharts.app`.

## Running locally
```bash
# Web depends on API; bring both up.
pnpm --filter @tcharts/api dev    # in one terminal
pnpm --filter @tcharts/web dev    # in another
```
Then open http://localhost:3000.

## Sprint 0 surface
- `/login` — placeholder login page (real auth in S1).
- `/dashboard` — placeholder Company Dashboard (real one in S10).
- `/companies`, `/settings` — placeholder pages.
- AppShell with three sidebar states (expanded/icon/hidden), persisted in `localStorage`.
- Tcharts design tokens wired through Tailwind preset.
