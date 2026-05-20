# Tcharts

> Accrual-first, multi-company, multi-user SaaS accounting platform for mid-market businesses.

**Status:** Sprint 0 — Foundation. Architecture committed; scaffolding in progress.

---

## What this is

Tcharts replaces a fragmented small-business accounting stack (QuickBooks + spreadsheets + email + shared drives + chat) with a single integrated workspace where:

- Bookkeeping is **accrual-native**, not cash-with-accrual-bolted-on.
- Accounting operations (documents, tasks, chat, calendar, notes) live next to the books in the **Accounting Hub**.
- A real **Period Control** engine — Soft Close and Hard Close — enforces month-end discipline.
- **Multi-company is first-class**, not an upsell: one Tcharts Account → many companies → company-scoped users, COA, permissions, and data.
- Per-user-per-company **permissions** are enforced at every API boundary.

For full product context, read the spec PDFs in the repo root: `DOC1_Development_Plan.pdf`, `DOC2_QA_Test_Plan.pdf`.

---

## Where to start (engineers)

1. **[`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md)** — system architecture.
2. **[`docs/REPO_STRUCTURE.md`](./docs/REPO_STRUCTURE.md)** — folder layout.
3. **[`docs/MODULE_MAP.md`](./docs/MODULE_MAP.md)** — module inventory and dependencies.
4. **[`docs/DB_SCHEMA.md`](./docs/DB_SCHEMA.md)** — data model.
5. **[`docs/PERMISSION_MODEL.md`](./docs/PERMISSION_MODEL.md)** — RBAC + overrides.
6. **[`docs/API_CONVENTIONS.md`](./docs/API_CONVENTIONS.md)** — REST/OpenAPI conventions.
7. **[`docs/SECURITY.md`](./docs/SECURITY.md)** — security baseline & threat model.
8. **[`docs/ENVIRONMENT.md`](./docs/ENVIRONMENT.md)** — env vars and secrets.
9. **[`docs/SPRINT_0_CHECKLIST.md`](./docs/SPRINT_0_CHECKLIST.md)** — what ships in Sprint 0.
10. **[`docs/adr/`](./docs/adr/)** — Architecture Decision Records (irrevocable history).

Then the relevant module README under `apps/api/src/modules/<name>/`.

---

## Tech stack

- **Frontend:** Next.js 15 (App Router) + TypeScript + Tailwind + shadcn/ui + TanStack Query + Zustand + React Hook Form + Zod
- **Backend:** NestJS (Fastify) + TypeScript + Prisma + PostgreSQL 16 + Redis + BullMQ + Socket.IO
- **Infra:** AWS (ECS Fargate, RDS, ElastiCache, SES) + Cloudflare (DNS, WAF, R2) + Terraform + GitHub Actions
- **Monorepo:** pnpm workspaces + Turborepo

See `docs/ARCHITECTURE.md` §3 for the full stack table and the rationale per choice. ADR-0001 captures the Next.js choice (a deviation from the original spec's Vite recommendation, formally accepted).

---

## Quickstart (local dev)

> **Windows + OneDrive users — read [`docs/runbooks/ONEDRIVE_SETUP.md`](./docs/runbooks/ONEDRIVE_SETUP.md) first**, before the first `pnpm install`.

Prerequisites:
- Node.js 20.x
- pnpm 9.x (`npm install -g pnpm`)
- Docker Desktop (for local Postgres + Redis + MailHog)

```bash
# 1. Install deps
pnpm install

# 2. Seed env file
cp .env.example .env

# 3. Bring up local services
docker compose -f infra/docker/docker-compose.local.yml up -d

# 4. Apply migrations + seed
pnpm db:migrate
pnpm db:seed

# 5. Generate API types from OpenAPI
pnpm contracts:generate

# 6. Run everything
pnpm dev
```

You should now have:
- `apps/api` on http://localhost:8080 — `/health` returns 200.
- `apps/web` on http://localhost:3000 — login page renders.
- `apps/worker` running in the background.
- MailHog UI on http://localhost:8025 (catches all outbound mail in dev).

---

## Repo layout (high level)

```
tcharts/
├── apps/
│   ├── web/          # Next.js 15
│   ├── api/          # NestJS HTTP API
│   └── worker/       # NestJS background jobs
├── packages/
│   ├── contracts/    # OpenAPI + Zod schemas
│   ├── ui/           # Design tokens + shadcn components
│   ├── db/           # Prisma schema + migrations
│   ├── domain/       # Pure domain types (Money, Roles, ...)
│   ├── utils/        # Framework-free helpers
│   └── config/       # Shared ESLint, Prettier, TS configs
├── infra/
│   ├── docker/
│   ├── terraform/
│   └── github-actions/
└── docs/
    ├── adr/
    └── runbooks/
```

Full details: [`docs/REPO_STRUCTURE.md`](./docs/REPO_STRUCTURE.md).

---

## Scripts

| Command                | Action                                                  |
|------------------------|---------------------------------------------------------|
| `pnpm dev`             | Run all apps in watch mode                              |
| `pnpm build`           | Production build of every app and package               |
| `pnpm test`            | Unit + integration tests (Vitest)                       |
| `pnpm test:e2e`        | End-to-end tests (Playwright)                           |
| `pnpm lint`            | ESLint across the workspace                             |
| `pnpm typecheck`       | `tsc --noEmit` across the workspace                     |
| `pnpm format`          | Prettier write                                          |
| `pnpm db:migrate`      | Apply Prisma migrations                                 |
| `pnpm db:seed`         | Seed local DB with reference data + dev fixtures        |
| `pnpm db:generate`     | Regenerate Prisma client                                |
| `pnpm contracts:generate` | Regenerate TS API client from OpenAPI                |

---

## Sprint plan (high level)

| Sprint | Theme                                                | Status     |
|--------|------------------------------------------------------|------------|
| S0     | Foundation — monorepo, infra, AppShell, CI           | In progress |
| S1     | Authentication + Journey A signup                    | Pending    |
| S2     | Companies, users, roles, switcher                    | Pending    |
| S3     | Settings + permission engine                         | Pending    |
| S4     | Cross-cutting backbone (Period Control, Journal, Audit, Idempotency, Approvals) | Pending |
| S5     | Chart of Accounts                                    | Pending    |
| S6     | Sales Tax                                            | Pending    |
| S7-9   | Accounting Hub (Documents, Tasks, Calendar, Notes, Chat) | Pending |
| S10    | Company Dashboard                                    | Pending    |
| S11    | Revenue                                              | Pending    |
| S12    | Expenses + Journey B completion                      | Pending    |
| S13    | General Ledger + Reports                             | Pending    |
| S14    | Banking + reconciliation                             | Pending    |
| S15    | Notifications, audit viewer, performance pass        | Pending    |
| S16    | Security hardening, UAT, launch                      | Pending    |

Full plan: `DOC1_Development_Plan.pdf` §9.

---

## Contributing

Internal repo. PRs must:

- Reference the sprint + acceptance criteria they close.
- Pass CI (lint, typecheck, unit, contract, build).
- Stay under 400 lines of diff where reasonable (hard cap 1,000 unless generated).
- Include test coverage for new code paths.
- Update the relevant module README if the public surface changes.

See `docs/SECURITY.md` §16 for the per-release hardening checklist.

---

## License

Proprietary. © SlashEasy.
