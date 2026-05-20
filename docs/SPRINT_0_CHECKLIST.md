# Sprint 0 — Foundation Setup — Checklist

> **Status:** Active
> **Goal (per DOC1 §9 Sprint 0):** Stand up the monorepo, dev/staging infra, base shell, design system tokens, and CI/CD so every later sprint slots in.
> **Duration:** 2 weeks (DOC1 cadence). For the solo-engineer + Claude Code path, expect ~2–3 weeks.
> **Definition of Done:** All P0 + P1 items below pass; smoke E2E green on staging; CI green; engineer can `pnpm dev` and see the AppShell.

This document is the **build order** for Sprint 0. Each item references the test cases from DOC2 §0 that verify it.

---

## Phase 0 — Architecture freeze (this turn)

- [x] `docs/ARCHITECTURE.md` written
- [x] `docs/adr/0001-frontend-nextjs-override.md` written
- [x] `docs/adr/0002-modular-monolith.md` written
- [x] `docs/adr/0003-tenant-isolation-rls.md` written
- [x] `docs/REPO_STRUCTURE.md` written
- [x] `docs/MODULE_MAP.md` written
- [x] `docs/DB_SCHEMA.md` written
- [x] `docs/PERMISSION_MODEL.md` written
- [x] `docs/API_CONVENTIONS.md` written
- [x] `docs/SECURITY.md` written

---

## Phase 1 — Workspace skeleton (foreground for next turn)

### 1.1 — Repo root files

- [ ] `.gitignore`
- [ ] `.gitattributes` (LF on Windows for source files)
- [ ] `.editorconfig`
- [ ] `.env.example` (template, no real values)
- [ ] `pnpm-workspace.yaml`
- [ ] `package.json` (workspace root)
- [ ] `tsconfig.base.json`
- [ ] `turbo.json`
- [ ] Top-level `README.md`
- [ ] `docs/runbooks/ONEDRIVE_SETUP.md` (OneDrive exclusions)

**Verifies:** TC-S0-FND-001 (pnpm install clean on fresh checkout).

### 1.2 — Shared packages

- [ ] `packages/config/` — ESLint, Prettier, TSConfig presets
- [ ] `packages/domain/` — Money, AccountType, Role, Permission, PeriodState enums
- [ ] `packages/utils/` — date, currency, validation helpers
- [ ] `packages/contracts/` — OpenAPI skeleton + Zod schemas dir + generated client placeholder
- [ ] `packages/ui/` — design tokens (CSS + TS), Tailwind preset, shadcn primitives copied
- [ ] `packages/db/` — Prisma schema skeleton + seed scaffold

**Verifies:** TC-S0-FND-010 (Tcharts Green primary button colour matches `#3DBF62`).

### 1.3 — Apps

- [ ] `apps/web/` — Next.js 15 App Router with anonymous + authed route groups, AppShell shell pages
- [ ] `apps/api/` — NestJS with Fastify, `/health`, `/ready`, request-ID middleware, Pino, Sentry init, empty modules folder structure
- [ ] `apps/worker/` — NestJS standalone (no HTTP), BullMQ consumer scaffold, no real jobs yet

**Verifies:** TC-S0-FND-002 (`pnpm dev` boots both apps), TC-S0-FND-005 (`/health` returns 200), TC-S0-FND-006 (`/ready` returns 503/200 correctly), TC-S0-FND-008 (AppShell renders).

### 1.4 — Local dev environment

- [ ] `infra/docker/docker-compose.local.yml` — Postgres 16, Redis 7, MailHog
- [ ] `infra/docker/web.Dockerfile`
- [ ] `infra/docker/api.Dockerfile`
- [ ] `infra/docker/worker.Dockerfile`
- [ ] Seeded local DB via `pnpm db:migrate && pnpm db:seed`

### 1.5 — CI/CD

- [ ] `.github/workflows/ci.yml` — lint, typecheck, unit, contract lint, build on every PR
- [ ] `.github/workflows/deploy-staging.yml` — on push to main (stub; real AWS infra ships in Phase 3)
- [ ] `.github/workflows/deploy-prod.yml` — manual approval (stub)

**Verifies:** TC-S0-FND-003 (CI ≤ 10 min on PR).

### 1.6 — Observability

- [ ] Sentry projects created: `tcharts-api`, `tcharts-worker`, `tcharts-web`
- [ ] Sentry SDK wired in all three apps
- [ ] Pino structured logger in API + worker with required fields
- [ ] Web error boundary with Sentry capture

**Verifies:** TC-S0-FND-007 (Sentry receives test errors).

### 1.7 — Security baseline

- [ ] `gitleaks` pre-commit hook
- [ ] Dependabot config (`.github/dependabot.yml`)
- [ ] Snyk CI integration (or `npm audit` equivalent)
- [ ] `docs/SECURITY.md` reviewed by product owner

---

## Phase 2 — Design system tokens & AppShell

### 2.1 — Tokens

- [ ] `packages/ui/src/tokens/tokens.css` — CSS custom properties for the full Tcharts palette (see Brand Guidelines)
- [ ] `packages/ui/src/tokens/tokens.ts` — same tokens as TS exports
- [ ] `packages/ui/src/tailwind-preset.ts` — Tailwind preset consuming the CSS vars
- [ ] `apps/web` consumes the preset; sample components render with token colours

**Verifies:** TC-S0-FND-010 (token colours), TC-S0-FND-011 (font-display: swap + tabular-nums where applicable).

### 2.2 — shadcn primitives

- [ ] Initialise shadcn/ui in `packages/ui`; primitives copied: Button, Input, Label, Select, Dialog, Drawer, Popover, Toast, Skeleton, Form
- [ ] Each primitive uses Tcharts tokens (no hard-coded colours)

### 2.3 — AppShell

- [ ] `apps/web/src/components/shell/AppShell.tsx`
- [ ] `Sidebar.tsx` — three states (expanded/icon/hidden), persisted in `localStorage` key `tcharts.shell.sidebar`
- [ ] `Topbar.tsx` — placeholder with brand
- [ ] `RightPanel.tsx` — placeholder (hidden by default for now; ungated until S9)
- [ ] Routes for all 10 modules wired up as blank pages with placeholder content

**Verifies:** TC-S0-FND-008 (AppShell), TC-S0-FND-009 (sidebar persistence).

---

## Phase 3 — AWS infrastructure (deferred — minimum viable for staging)

This phase can be deferred if the solo-engineer path needs to focus on app skeleton first. Minimum viable for end-of-Sprint-0:

- [ ] Terraform skeleton in `infra/terraform/envs/staging/`
- [ ] VPC + subnets (public + private + DB)
- [ ] RDS Postgres 16 db.t4g.medium Multi-AZ in `staging`
- [ ] ElastiCache Redis 7 cache.t4g.small in `staging`
- [ ] ECS cluster with three Fargate services (`web`, `api`, `worker`) — initially with placeholder container images
- [ ] ALB with two listeners (`app.tcharts.app`, `api.tcharts.app`)
- [ ] SES domain identity verified
- [ ] Cloudflare DNS pointing at the ALB
- [ ] Secrets Manager entries for DB/Redis/JWT keys
- [ ] CloudWatch dashboards + alarms

**Verifies:** TC-S0-FND-004 (deploy to staging succeeds end-to-end), TC-S0-FND-014 (CDN + gzip).

If Phase 3 is deferred, **the apps must still run on the engineer's local machine** via docker-compose and `pnpm dev`.

---

## Phase 4 — Storybook + a11y baseline

- [ ] Storybook (or Ladle) for `packages/ui`
- [ ] One story per shadcn primitive
- [ ] `@axe-core/playwright` baseline run; zero violations on shell + primitives

**Verifies:** TC-S0-FND-012 (Storybook builds), TC-S0-FND-013 (a11y baseline), TC-S0-FND-015 (prefers-reduced-motion).

---

## Sprint 0 — exit criteria

All must be true to call Sprint 0 done:

- [ ] All P0 items in DOC2 §0 pass on staging (or on local dev if Phase 3 deferred)
- [ ] Architecture docs (Phase 0) committed and reviewed
- [ ] At least one engineer has gone `git clone` → `pnpm install` → `pnpm dev` → AppShell renders in browser, in under 15 minutes, from a fresh machine
- [ ] An intentional test error in each app surfaces in Sentry
- [ ] CI runs in ≤ 10 minutes on a PR with no changes
- [ ] No `TODO: replace before sprint 1` comments left in checked-in code (Phase 3 stubs excepted, and called out in README)

---

## Sequencing for the solo-engineer + Claude Code path

The order this gets built in **this thread** is:

1. ✅ Architecture docs (Phase 0) — done.
2. **Phase 1.1** — repo root files.
3. **Phase 1.2** — shared packages, starting with `@tcharts/config`, `@tcharts/domain`, then `@tcharts/contracts`, `@tcharts/ui`, `@tcharts/db`.
4. **Phase 1.3** — `apps/api` (NestJS + Fastify + health endpoints + Pino + Sentry), then `apps/worker`, then `apps/web` (Next.js + AppShell skeleton).
5. **Phase 1.4** — docker-compose for local Postgres + Redis.
6. **Phase 2** — design tokens + shadcn primitives + AppShell flesh-out.
7. **Phase 1.5** — CI.
8. **Phase 1.6** — Sentry / Pino wiring (some of this lands during Phase 1.3).
9. **Phase 1.7** — security baseline.
10. **Phase 3** — Terraform (deferred until you have AWS credentials configured).
11. **Phase 4** — Storybook + a11y baseline.

This sequence gets you to "running locally with shell and health endpoints" first, before AWS infra — which is the correct order for a solo build.

---

## What's deliberately **not** in Sprint 0

- Authentication (Sprint 1).
- Any module beyond the shell.
- COA seed data (Sprint 5).
- Period control (Sprint 4).
- Real Sentry / PostHog accounts (we wire SDKs with DSNs from env; you can use empty DSNs in local).
- Production AWS infra (we set up staging; prod accounts come online before Sprint 14).
