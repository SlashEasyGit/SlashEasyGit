# Tcharts — Repository Structure

> **Status:** Draft v0.1 (Sprint 0)
> **Read first:** `ARCHITECTURE.md`

The repository is a **pnpm workspace monorepo** managed with **Turborepo** for task orchestration and incremental builds.

---

## 1. Top-level layout

```
tcharts/
├── apps/                       # Deployable applications (3)
│   ├── web/                    # Next.js 15 — UI shell + pages
│   ├── api/                    # NestJS — HTTP + WebSocket API
│   └── worker/                 # NestJS — BullMQ background jobs
│
├── packages/                   # Internal shared libraries (consumed only by apps/*)
│   ├── contracts/              # OpenAPI spec + generated TS client + Zod schemas
│   ├── ui/                     # Shared React components, design tokens, Tailwind preset
│   ├── db/                     # Prisma schema, migrations, seed scripts
│   ├── domain/                 # Pure domain types and value objects (Money, AccountType, etc.)
│   ├── config/                 # Shared ESLint, Prettier, TSConfig presets
│   └── utils/                  # Pure utility functions (date, currency, validation)
│
├── infra/                      # Infrastructure-as-code and deployment artefacts
│   ├── docker/                 # Multi-stage Dockerfiles per app
│   ├── terraform/              # AWS infra (VPC, RDS, ECS, ALB, SES, IAM, R2 binding)
│   └── github-actions/         # Reusable composite actions
│
├── docs/                       # Architecture and reference documentation
│   ├── ARCHITECTURE.md         # System-level architecture overview
│   ├── REPO_STRUCTURE.md       # This document
│   ├── MODULE_MAP.md           # NestJS module inventory and dependencies
│   ├── DB_SCHEMA.md            # Database schema reference
│   ├── PERMISSION_MODEL.md     # RBAC + per-user override resolution
│   ├── API_CONVENTIONS.md      # OpenAPI conventions, error envelopes, idempotency
│   ├── SECURITY.md             # Threat model summary, hardening baseline
│   ├── SPRINT_0_CHECKLIST.md   # What ships in Sprint 0
│   ├── runbooks/               # Operational runbooks
│   │   ├── INCIDENT.md
│   │   ├── DISASTER_RECOVERY.md
│   │   ├── ROLLBACK.md
│   │   └── ON_CALL.md
│   └── adr/                    # Architecture Decision Records (immutable history)
│       ├── 0001-frontend-nextjs-override.md
│       ├── 0002-modular-monolith.md
│       └── 0003-tenant-isolation-rls.md
│
├── .github/
│   └── workflows/
│       ├── ci.yml              # Lint, typecheck, unit, contract, build
│       ├── deploy-staging.yml  # On push to main
│       └── deploy-prod.yml     # Manual approval gated
│
├── .vscode/                    # Recommended workspace settings (gitignored except settings.json)
│   └── settings.json
│
├── .gitignore
├── .gitattributes              # LF line endings on Windows
├── .editorconfig
├── .env.example                # Template; no real env file committed
├── package.json                # Workspace root; only devDeps and scripts
├── pnpm-workspace.yaml
├── pnpm-lock.yaml
├── turbo.json
├── tsconfig.base.json          # Shared TS config inherited by all packages
└── README.md
```

---

## 2. `apps/web/` — Next.js 15

```
apps/web/
├── src/
│   ├── app/                              # App Router file-based routes
│   │   ├── layout.tsx                    # Root layout (RSC)
│   │   ├── page.tsx                      # Redirect to /login or /dashboard
│   │   ├── (anonymous)/                  # Route group: unauth-only pages
│   │   │   ├── layout.tsx                # Redirects to /companies if authed
│   │   │   ├── login/
│   │   │   ├── signup/
│   │   │   │   ├── page.tsx              # Screen 1: email/password/phone/ToS
│   │   │   │   ├── otp/page.tsx          # Phone OTP verify
│   │   │   │   └── setup/page.tsx        # Screen 2: name + company
│   │   │   ├── forgot-password/
│   │   │   └── reset-password/
│   │   ├── (authed)/                     # Route group: auth-required
│   │   │   ├── layout.tsx                # AppShell (sidebar/topbar/right panel) — RSC
│   │   │   ├── select-company/page.tsx   # If user has > 1 company and none selected
│   │   │   └── companies/
│   │   │       └── [companyId]/          # Per-company scope
│   │   │           ├── layout.tsx        # Sets currentCompanyId in cookies + context
│   │   │           ├── dashboard/page.tsx
│   │   │           ├── coa/
│   │   │           ├── revenue/
│   │   │           ├── expenses/
│   │   │           ├── general-ledger/
│   │   │           ├── banking/
│   │   │           ├── reports/
│   │   │           ├── hub/
│   │   │           │   ├── documents/
│   │   │           │   ├── tasks/
│   │   │           │   ├── calendar/
│   │   │           │   ├── chat/
│   │   │           │   └── notes/
│   │   │           └── settings/
│   │   ├── api/                          # Next route handlers — BFF utilities only
│   │   │   └── auth/
│   │   │       └── refresh/route.ts      # Proxies to NestJS, manages cookie
│   │   └── globals.css                   # Tailwind directives + design token CSS vars
│   │
│   ├── components/
│   │   ├── shell/                        # AppShell, Sidebar, Topbar, RightPanel
│   │   ├── ui/                           # shadcn-imported primitives (button, input, dialog, ...)
│   │   ├── accounting/                   # MoneyCell, AccountSelector, PeriodIndicator, JournalEntryEditor
│   │   ├── patterns/                     # DataTable, FormShell, EmptyState, ErrorBoundary
│   │   └── providers/                    # ReactQueryProvider, AuthProvider, ThemeProvider
│   │
│   ├── hooks/                            # usePermission, useCurrentCompany, useApiError, ...
│   ├── lib/
│   │   ├── api-client.ts                 # Wraps @tcharts/contracts client with auth
│   │   ├── auth.ts                       # Token storage (memory), refresh logic
│   │   ├── cookies.ts                    # Cookie helpers (server-only)
│   │   ├── permissions.ts                # Permission resolution helpers
│   │   └── env.ts                        # Validated env vars (Zod)
│   │
│   ├── stores/                           # Zustand stores (client state only)
│   │   ├── sidebar.store.ts
│   │   └── right-panel.store.ts
│   │
│   ├── styles/
│   │   └── tokens.css                    # CSS custom properties from packages/ui
│   │
│   └── middleware.ts                     # Next middleware: auth + currentCompany guard
│
├── public/
│   ├── fonts/                            # Self-hosted Poppins, Open Sans, JetBrains Mono
│   └── logos/                            # Tcharts brand assets
│
├── next.config.mjs
├── tailwind.config.ts
├── postcss.config.mjs
├── tsconfig.json
└── package.json
```

### Server-vs-client component policy

- **Server component (default):** layouts, route-level auth gates, read-only initial paint for a screen.
- **Client component (`'use client'`):** any component that uses `useState`, `useEffect`, TanStack Query, Socket.IO, Zustand, React Hook Form, or interactive UI.
- **Hard rule:** no server actions for accounting mutations. All mutations go through the typed API client → NestJS API. Server actions, if used at all, are limited to cookie/CSRF helpers and explicitly not for posting paths. (See ADR-0001 §Consequences.)

---

## 3. `apps/api/` — NestJS HTTP

```
apps/api/
├── src/
│   ├── main.ts                           # Fastify bootstrap, global pipes/guards/filters
│   ├── app.module.ts                     # Wires every module
│   ├── config/                           # Validated config (Zod) loaded from env
│   │
│   ├── modules/                          # Domain modules — see MODULE_MAP.md
│   │   ├── auth/
│   │   ├── tcharts-account/
│   │   ├── company/
│   │   ├── user-management/
│   │   ├── permission/
│   │   ├── settings/
│   │   ├── coa/
│   │   ├── period-control/
│   │   ├── sales-tax/
│   │   ├── approval-workflow/
│   │   ├── accounting-hub/
│   │   │   ├── documents/
│   │   │   ├── tasks/
│   │   │   ├── calendar/
│   │   │   ├── chat/
│   │   │   └── notes/
│   │   ├── company-dashboard/
│   │   ├── revenue/                      # Sprint 11
│   │   ├── expense/                      # Sprint 12
│   │   ├── general-ledger/               # Sprint 13
│   │   ├── banking/                      # Sprint 14
│   │   └── reports/                      # Sprint 13
│   │
│   └── shared/                           # Cross-cutting infrastructure
│       ├── tenant-context/               # Request-scoped TenantContext
│       ├── journal-posting/              # The accounting engine
│       ├── audit-log/                    # Append-only audit writer
│       ├── idempotency/                  # Idempotency-Key middleware
│       ├── notifications/                # Email + Socket fan-out
│       ├── file/                         # Cloudflare R2 wrapper
│       ├── realtime/                     # Socket.IO gateway with Redis adapter
│       ├── feature-flag/                 # FeatureFlagService
│       ├── logger/                       # Pino setup
│       ├── prisma/                       # Prisma client provider with RLS hooks
│       ├── redis/                        # Redis client provider
│       ├── errors/                       # AppError hierarchy + global filter
│       ├── decorators/                   # @RequirePermission, @RequireCompanyContext, @Ctx, ...
│       ├── pipes/                        # ZodValidationPipe
│       ├── guards/                       # AuthGuard, PermissionGuard, CompanyContextGuard
│       ├── interceptors/                 # AuditInterceptor, IdempotencyInterceptor
│       ├── middleware/                   # RequestIdMiddleware, TenantContextMiddleware, RLSMiddleware
│       └── health/                       # /health, /ready
│
├── test/                                 # Integration tests (Vitest + Testcontainers)
├── nest-cli.json
├── tsconfig.json
└── package.json
```

### Module anatomy

Every module under `apps/api/src/modules/<name>/` has:

```
<name>/
├── index.ts                  # PUBLIC barrel — only this is importable from other modules
├── README.md                 # Purpose, public surface, dependencies, invariants, owned tables
├── <name>.module.ts          # NestJS module
├── <name>.controller.ts      # HTTP routes (one or more)
├── <name>.service.ts         # Business logic (one or more)
├── <name>.repository.ts      # Prisma access (NEVER imported by other modules)
├── dto/
│   ├── create-*.dto.ts
│   └── update-*.dto.ts
├── schemas/                  # Zod schemas (imported from @tcharts/contracts if shared)
├── events/                   # Domain events emitted by this module
└── __tests__/                # Unit + integration tests colocated
```

---

## 4. `apps/worker/` — NestJS BullMQ

```
apps/worker/
├── src/
│   ├── main.ts                           # Boots NestJS standalone (no HTTP)
│   ├── app.module.ts
│   ├── processors/                       # One BullMQ processor per job class
│   │   ├── recurring-journal-entries.processor.ts
│   │   ├── bank-sync.processor.ts
│   │   ├── email-send.processor.ts
│   │   ├── audit-log-flush.processor.ts
│   │   ├── month-end-close-precheck.processor.ts
│   │   └── idempotency-cache-cleanup.processor.ts
│   └── shared/                           # Same shared modules as apps/api/
├── nest-cli.json
└── package.json
```

The worker imports the same `apps/api/src/modules/*` services (via TypeScript path mapping) so business logic is not duplicated. Job processors are thin shells that resolve `TenantContext` from the job payload, set the RLS session variable, and call the appropriate module service.

---

## 5. `packages/contracts/`

```
packages/contracts/
├── src/
│   ├── openapi.yaml                      # Source of truth for the API
│   ├── schemas/                          # Zod schemas (imported by web + api)
│   │   ├── auth.ts
│   │   ├── company.ts
│   │   ├── coa.ts
│   │   └── ...
│   ├── generated/                        # Generated TS client (do not edit)
│   │   ├── client.ts
│   │   └── types.ts
│   └── index.ts
├── scripts/
│   ├── generate-client.ts                # Regenerate TS client from openapi.yaml
│   └── lint-openapi.ts                   # Spectral lint
├── .spectral.yaml
├── tsconfig.json
└── package.json
```

The OpenAPI document is **the contract**. CI runs `spectral lint` and a "no breaking changes" diff against the version on `main`.

---

## 6. `packages/db/`

```
packages/db/
├── prisma/
│   ├── schema.prisma                     # Prisma schema
│   ├── migrations/                       # prisma migrate-managed migrations
│   │   └── 00000000_init/
│   │       ├── migration.sql
│   │       └── rls.sql                   # Raw SQL: enable RLS, create policies
│   └── seed/
│       ├── seed.ts                       # Idempotent seed for local dev
│       ├── role-permission-defaults.ts   # The matrix from System Spec §3.6
│       └── coa-defaults.ts               # The 29 default Tcharts accounts
├── src/
│   ├── client.ts                         # Re-exported PrismaClient with extensions
│   └── extensions/
│       ├── soft-delete.ts                # Prisma extension for soft-delete filter
│       └── rls-context.ts                # Sets app.current_company_id per query
└── package.json
```

Migrations are applied by a one-off ECS task during deployment (DOC1 §10.14).

---

## 7. `packages/ui/`

```
packages/ui/
├── src/
│   ├── tokens/
│   │   ├── tokens.css                    # CSS custom properties (the source of truth)
│   │   └── tokens.ts                     # Same tokens typed for TS consumers
│   ├── primitives/                       # shadcn-imported, customized to Tcharts tokens
│   ├── components/                       # Custom accounting components shared across apps
│   ├── tailwind-preset.ts                # Tailwind preset consumed by apps/web/tailwind.config.ts
│   └── index.ts
└── package.json
```

---

## 8. `packages/domain/`

Pure TypeScript domain types. No runtime dependencies on React, NestJS, Prisma, etc.

```
packages/domain/
├── src/
│   ├── money.ts                          # Money value object (wraps decimal.js)
│   ├── account-type.ts                   # Asset / Liability / Equity / Income / Expense + ranges
│   ├── role.ts                           # PrimaryAdmin | CompanyAdmin | Accountant | ExternalUser
│   ├── permissions.ts                    # Permission enum (module × task)
│   ├── period-state.ts                   # Open | SoftClosed | HardClosed
│   ├── errors.ts                         # Domain error codes (PERIOD_HARD_CLOSED, ...)
│   └── index.ts
└── package.json
```

---

## 9. `packages/config/`

```
packages/config/
├── eslint/
│   ├── base.js                           # Base rules, import boundaries, money lint
│   ├── react.js                          # Extends base for React apps
│   └── nest.js                           # Extends base for NestJS apps
├── prettier/
│   └── index.js
├── tsconfig/
│   ├── base.json
│   ├── react.json
│   └── node.json
└── package.json
```

---

## 10. `packages/utils/`

Pure functions, framework-agnostic. Date helpers, currency formatters, validation helpers, retry/backoff.

---

## 11. `infra/`

```
infra/
├── docker/
│   ├── web.Dockerfile
│   ├── api.Dockerfile
│   ├── worker.Dockerfile
│   └── docker-compose.local.yml          # Local Postgres + Redis + MailHog
├── terraform/
│   ├── envs/
│   │   ├── dev/
│   │   ├── staging/
│   │   └── prod/
│   └── modules/
│       ├── vpc/
│       ├── rds/
│       ├── elasticache/
│       ├── ecs-service/
│       ├── alb/
│       └── ses/
└── github-actions/
    └── composite/                        # Reusable composite actions
```

---

## 12. Workspace conventions

### Package naming

All internal packages: `@tcharts/<name>` (e.g., `@tcharts/contracts`, `@tcharts/db`).

### Dependency direction

```
apps/web    →  @tcharts/contracts, @tcharts/ui, @tcharts/domain, @tcharts/utils, @tcharts/config
apps/api    →  @tcharts/contracts, @tcharts/db, @tcharts/domain, @tcharts/utils, @tcharts/config
apps/worker →  @tcharts/contracts, @tcharts/db, @tcharts/domain, @tcharts/utils, @tcharts/config
                                  (plus type-only imports of apps/api modules via tsconfig path)
```

- `packages/*` never depend on `apps/*`.
- `apps/*` never depend on each other.
- `packages/ui` never depends on `packages/db` (UI must stay pure-frontend).
- `packages/domain` has zero internal dependencies.

### Versioning

All packages pinned at `0.0.0` and consumed via workspace protocol (`"@tcharts/contracts": "workspace:*"`). Published versions are not used in v1.

### Scripts (root `package.json`)

```json
{
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "test": "turbo test",
    "test:e2e": "turbo test:e2e",
    "lint": "turbo lint",
    "typecheck": "turbo typecheck",
    "db:generate": "pnpm --filter @tcharts/db prisma generate",
    "db:migrate": "pnpm --filter @tcharts/db prisma migrate dev",
    "db:seed": "pnpm --filter @tcharts/db tsx prisma/seed/seed.ts",
    "contracts:generate": "pnpm --filter @tcharts/contracts generate-client",
    "format": "prettier --write \"**/*.{ts,tsx,json,md}\""
  }
}
```

---

## 13. OneDrive caveat

The repo lives under OneDrive at the product owner's request. The following are excluded from OneDrive sync via `.gitignore` *and* via OneDrive's "Always keep on this device" + the `desktop.ini` exclusions documented in `docs/runbooks/ONEDRIVE_SETUP.md`:

- `node_modules/` (every level)
- `.next/`
- `.turbo/`
- `dist/`, `build/`
- `coverage/`
- `*.log`

If pnpm install or Prisma generate fails with `EBUSY` or `EPERM`, the first thing to check is OneDrive sync state on those folders.
