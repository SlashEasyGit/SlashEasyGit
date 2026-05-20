# Tcharts — System Architecture

> **Status:** Draft v0.1 (Sprint 0)
> **Authority:** Derived from `DOC1_Development_Plan.pdf` and `DOC2_QA_Test_Plan.pdf`. Where this document diverges from DOC1, an ADR under `docs/adr/` records the deviation and rationale.
> **Audience:** Every engineer touching this codebase.

---

## 1. Executive summary

Tcharts is an **accrual-first, multi-company, multi-user SaaS accounting platform** for mid-market accounting teams. The architecture is a **modular monolith** (one Postgres database, two Node processes, one web app) with **three-layer tenant isolation** (app guard + repository assertion + Postgres Row-Level Security).

The platform's three non-negotiable invariants:

1. **Accounting integrity** — every journal entry is balanced (`SUM(debit) = SUM(credit)` to 4 decimals), enforced by DB CHECK + service guard + property tests.
2. **Tenant isolation** — no user can read or write data belonging to a company they are not assigned to, enforced at three independent layers.
3. **Period control** — no transaction can post into a Hard-Closed period under any circumstance, including system-generated entries. Soft-Closed periods block non-Admin posting.

Everything else in the architecture exists to protect these three invariants.

---

## 2. Topology

```
                              Internet
                                 │
                            ┌────┴────┐
                            │Cloudflare│  (DNS, WAF, CDN, DDoS)
                            └────┬────┘
                                 │
                         ┌───────┴────────┐
                         │      ALB       │  app.tcharts.app, api.tcharts.app
                         └───────┬────────┘
                                 │
              ┌──────────────────┼───────────────────┐
              │                  │                   │
       ┌──────▼──────┐    ┌──────▼──────┐    ┌──────▼──────┐
       │ ECS Service │    │ ECS Service │    │ ECS Service │
       │   `web`     │    │   `api`     │    │  `worker`   │
       │  Next.js 15 │    │  NestJS HTTP│    │  NestJS Jobs│
       │  (RSC + RC) │    │  (Fastify)  │    │  (BullMQ)   │
       └──────┬──────┘    └──────┬──────┘    └──────┬──────┘
              │                  │                   │
              │                  └─────────┬─────────┘
              │                            │
              │            ┌───────────────┴─────────────────┐
              │            │                                 │
              │     ┌──────▼──────┐                  ┌──────▼──────┐
              │     │ RDS Postgres│                  │ElastiCache  │
              │     │  Multi-AZ   │                  │  Redis 7    │
              │     │   v16       │                  │ (cache+BullMQ)
              │     └─────────────┘                  └─────────────┘
              │
              │      ┌──────────────┐    ┌──────────────┐
              └──────► Cloudflare R2│    │   AWS SES    │
                     │ (file store) │    │ (email out)  │
                     └──────────────┘    └──────────────┘
```

**Three deployable services**, all separate ECS Fargate services:

| Service  | Runtime          | Public  | Purpose                                                              |
|----------|------------------|---------|----------------------------------------------------------------------|
| `web`    | Next.js 15 Node  | Yes     | UI shell, RSC for auth-gated layout, client components for app pages |
| `api`    | NestJS + Fastify | Yes     | All HTTP + WebSocket request handling, business logic, RBAC          |
| `worker` | NestJS + BullMQ  | No      | Recurring JEs, bank sync, email send, audit flush, month-end pre-check |

**Why three processes, not two?** Splitting the worker from the API means a slow job (large bank sync, audit-log flush) cannot starve API request threads. Splitting `web` from `api` means we can scale the SSR frontend and the API independently and have separate failure domains for outages.

**Why `web` is a Node service, not a static bundle:** see `adr/0001-frontend-nextjs-override.md`. This is the largest deviation from DOC1.

---

## 3. Tech stack (final)

| Layer                | Choice                                              | Source            |
|----------------------|-----------------------------------------------------|-------------------|
| Frontend framework   | **Next.js 15 (App Router)** + TypeScript            | ADR-0001 (override DOC1 §3.1) |
| UI primitives        | shadcn/ui + Tailwind CSS                            | DOC1 §3.4         |
| Data fetching        | TanStack Query (client) + RSC `fetch` (server)      | DOC1 §3.3 + ADR-0001 |
| Forms                | React Hook Form + Zod                               | DOC1 §3.5         |
| State (client)       | Zustand (small stores only)                         | DOC1 §3.12        |
| Backend framework    | NestJS + Fastify adapter                            | DOC1 §3.6         |
| ORM                  | Prisma + raw SQL where Prisma can't (RLS, partition)| DOC1 §3.7         |
| Database             | PostgreSQL 16 on AWS RDS, Multi-AZ                  | DOC1 §3.8         |
| Auth                 | Custom JWT (RS256) + opaque refresh + Twilio OTP    | DOC1 §3.9         |
| API contract         | OpenAPI 3.1 (source of truth) + generated TS types  | DOC1 §3.11        |
| Real-time            | Socket.IO + Redis adapter                           | DOC1 §3.13        |
| Job queue            | BullMQ on Redis                                     | DOC1 §3.14        |
| Cache                | Redis (ElastiCache)                                 | DOC1 §3.17        |
| File storage         | Cloudflare R2 (S3-compatible)                       | DOC1 §3.16        |
| Email                | AWS SES                                             | DOC1 §3.26        |
| Logging              | Pino → CloudWatch + Sentry breadcrumbs              | DOC1 §3.18        |
| Errors               | Sentry                                              | DOC1 §3.19        |
| Analytics            | PostHog (EU region)                                 | DOC1 §3.20        |
| Compute              | AWS ECS Fargate (3 services)                        | DOC1 §3.24        |
| CDN                  | Cloudflare (DNS+WAF) + CloudFront (where useful)    | DOC1 §3.25 (adapted per ADR-0001) |
| CI/CD                | GitHub Actions                                      | DOC1 §3.21        |
| IaC                  | Terraform                                           | DOC1 §10.1        |
| Monorepo             | pnpm workspaces + Turborepo                         | New (Sprint 0)    |

---

## 4. Tenant isolation — the three layers

Every company-scoped table is guarded at **three independent layers**. All three must hold for isolation to be safe; if any layer is silently broken, the others still prevent leakage.

### Layer 1 — application guard (route)

Every NestJS controller route uses two decorators:

```ts
@RequireCompanyContext()                          // verifies user has UserCompanyAccess to currentCompanyId
@RequirePermission('revenue', 'enter_transactions') // checks effective permission
@Post('invoices')
createInvoice(@Ctx() ctx: TenantContext, @Body() dto: CreateInvoiceDto) { ... }
```

`TenantContext` carries `(userId, tchartsAccountId, currentCompanyId, role, effectivePermissions)` and is request-scoped — never module-scoped, never static.

### Layer 2 — repository assertion (data access)

Every repository method takes `companyId` as a required argument and asserts it matches the request's `TenantContext`. ESLint rule `import/no-restricted-paths` forbids repositories from being imported across module boundaries, so cross-module reads must go through the source module's public service.

### Layer 3 — Postgres Row-Level Security (database)

Every company-scoped table has:

```sql
CREATE POLICY company_isolation ON {table}
  USING (company_id = current_setting('app.current_company_id')::uuid);

ALTER TABLE {table} ENABLE ROW LEVEL SECURITY;
ALTER TABLE {table} FORCE ROW LEVEL SECURITY;  -- forces even for table owner
```

The connection-pool middleware sets `SET LOCAL app.current_company_id = '...'` at the start of every request's transaction. If application code is wrong and queries a row from another company, **Postgres returns zero rows** — the database refuses to leak.

A second policy (`tcharts_account_isolation`) applies to account-scoped tables like `user`, `tcharts_account` itself, `refresh_token`.

See `adr/0003-tenant-isolation-rls.md` for the full rationale and edge cases.

---

## 5. Accounting integrity — invariants

The platform's reason to exist is that an accountant trusts it with their books. The invariants below are enforced at multiple layers and verified by the QA suite (DOC2 §I.E, AC-INT-01 through AC-INT-17).

| Invariant | Enforcement |
|-----------|-------------|
| Every `journal_entry` has `SUM(debit) = SUM(credit)` | DB deferrable CHECK + service guard + property tests (fast-check) |
| Every `journal_entry_line` references a valid, **active** COA account in the same company | FK + repository guard |
| No posting into a Hard-Closed period (including system entries) | `PeriodControlService.assertCanPost()` called *inside* the transaction |
| No posting into a Soft-Closed period for non-Admin users | Same gate, role-aware |
| Posted transactions cannot be hard-deleted | Repository guard + DB trigger backstop; only `reversal_of` allowed |
| `RecognizeDate` drives all reporting | Mandatory `recognize_date` column on every transactional table; reports query by date range against it |
| Account number must fall in the valid range for the account type | Validated at write time in COA service |
| Money values use `numeric(18,4)`; **no float arithmetic anywhere** | Lint rule + CI grep audit |
| Trial Balance for any company on any date sums to zero | Nightly reconciliation job in staging, alerts on drift |

### The posting contract

Every module that mutates the books **must** route through `JournalPostingService.post(input)`. The service:

1. Validates `SUM(debit) === SUM(credit)` to 4 decimals.
2. Calls `PeriodControlService.assertCanPost(companyId, recognizeDate, userRole, isSystemEntry)`.
3. Opens a `Serializable`-isolation Postgres transaction.
4. Inserts the originating module record (Bill / Invoice / JE / Payment).
5. Inserts balanced `journal_entry` + `journal_entry_line` rows.
6. Inserts `audit_log` row with `before_json` / `after_json`.
7. Inserts `approval_request` row if the company has approval enabled for this transaction type.
8. Emits a `transaction.posted` domain event for downstream consumers (Dashboard cache, Right Panel badges, Reports).
9. Returns the response (cached by `Idempotency-Key` for 24h).

If any step fails, the entire transaction rolls back — there are no partial postings.

---

## 6. Request lifecycle — posting a Bill

```
User clicks "Post Bill" in the UI
        │
        ▼
Next.js route handler (server) forwards with Idempotency-Key header
        │
        ▼
api/POST /api/v1/expense/bills (mutating route)
        │
        ▼
[1] Request-ID middleware                  → attaches requestId to logger
[2] Auth middleware                        → verifies JWT, loads User
[3] Tenant-context middleware              → resolves currentCompanyId, validates UserCompanyAccess
[4] RLS middleware                         → SET LOCAL app.current_company_id on the connection
[5] Permission guard (decorator)           → @RequirePermission('expense','enter_transactions')
[6] Idempotency middleware                 → checks Redis for Idempotency-Key replay
[7] Zod validation pipe                    → CreateBillDto
[8] BillsController.create() → BillsService.create() → JournalPostingService.post()
        │
        ▼
Inside Serializable transaction:
   - PeriodControlService.assertCanPost(companyId, recognizeDate, role, false)
   - ApprovalWorkflowService.requiresApproval(companyId, 'bill') → boolean
   - INSERT bill + bill_line
   - if !requiresApproval: INSERT journal_entry + journal_entry_line (balanced)
   - if requiresApproval: INSERT approval_request (no journal yet)
   - INSERT audit_log row
        │
        ▼
EventEmitter2 emits 'transaction.posted' or 'approval.requested'
        │
        ▼
Idempotency cache stores response body (TTL 24h)
        │
        ▼
Response → 201 + Bill resource
```

Steps 1–4 run on **every** authenticated request. Steps 5–9 are the per-route surface area.

---

## 7. Cross-cutting concerns map

| Concern               | Module                           | Sprint introduced |
|-----------------------|----------------------------------|-------------------|
| Authentication        | `auth/`                          | Sprint 1          |
| Authorization (RBAC)  | `permission/`                    | Sprint 3          |
| Tenant context        | `shared/tenant-context/`         | Sprint 2          |
| Period control        | `period-control/`                | Sprint 4          |
| Journal posting       | `shared/journal-posting/`        | Sprint 4          |
| Audit logging         | `shared/audit-log/`              | Sprint 4          |
| Idempotency           | `shared/idempotency/`            | Sprint 4          |
| Approval workflow     | `approval-workflow/`             | Sprint 4          |
| Notifications         | `shared/notifications/`          | Sprint 9 + 15     |
| File storage (R2)     | `shared/file/`                   | Sprint 7          |
| Real-time (Socket.IO) | `shared/realtime/`               | Sprint 9          |
| Feature flags         | `shared/feature-flag/`           | Sprint 0 (stub)   |

**Module boundary rules** (ESLint-enforced):

1. A module's controllers and services may only import from: its own module, `shared/*`, or other modules' **public services** (re-exported from `modules/<name>/index.ts`).
2. A module **must never** import another module's repositories or DB queries.
3. Cross-module data access goes through public service methods or domain events.

---

## 8. Data flow philosophy

- **Server state** lives in TanStack Query (client) or RSC `fetch` with explicit cache tags (server). Never duplicate.
- **Client state** (sidebar collapsed?, modal open?) lives in tiny Zustand stores.
- **Domain events** are in-process via `EventEmitter2` in v1. Events are intentionally not durable; consumers must tolerate missed events and reconcile from the database. If we ever need durability we'll route through BullMQ.
- **Per-company cache keys** for query data: `['invoices', companyId, filters]`. On company switch, `queryClient.removeQueries({ queryKey: ['invoices', previousCompanyId] })`.

---

## 9. Money handling

- All monetary columns are `numeric(18,4)`.
- All code uses a `Money` value object (thin wrapper around `decimal.js`).
- **No float arithmetic** — enforced by ESLint rule (`no-restricted-syntax` against `Number` operations on Money types) and a CI grep that scans for `parseFloat`, `Number(` on money fields, and `/100` patterns.
- Display rounding only at the presentation layer. Storage and intermediate calculations preserve 4 decimals.
- USD-only in v1. The `currency` column exists on monetary tables for future multi-currency, but any non-USD value is rejected at the API with 501.

---

## 10. Dates and times

- All transactional tables carry `recognize_date date NOT NULL` (the controlling accounting date) and `posted_at timestamptz NOT NULL` (the data-entry timestamp).
- All period-control gates use `recognize_date`. **Never** `created_at`, **never** the user's local clock.
- All `timestamptz` columns store UTC. Display conversion happens at the presentation layer using the company's `time_zone` (configured in `company_settings`).
- All date-only fields (e.g., `recognize_date`, `due_date`) are typed `date`, never `timestamp` — they are calendar dates in the company's reporting timezone, not instants.

---

## 11. Environments

| Environment  | Purpose                              | Data                                             |
|--------------|--------------------------------------|--------------------------------------------------|
| `local`      | Engineer's machine                   | docker-compose (Postgres + Redis), seeded        |
| `dev`        | Shared integration                   | Shared DB, anonymized demo data                  |
| `staging`    | Pre-prod verification                | Mirrors prod config; smoke tests on every deploy |
| `production` | Customer-facing                      | Real data, Multi-AZ, daily PITR backups          |

Each environment has its own AWS account where feasible (DOC1 §4.16). Secrets in AWS Secrets Manager, never in `.env` files in any environment beyond `local`.

---

## 12. Open decisions

Tracked here, resolved via ADR before the affected sprint starts.

| # | Question                                                              | Owed by      |
|---|-----------------------------------------------------------------------|--------------|
| 1 | Per-tenant R2 prefix vs per-tenant R2 bucket                          | Sprint 7     |
| 2 | Notification preferences default state (opt-in vs opt-out per type)   | Sprint 9     |
| 3 | Cash-basis report computation strategy (live derivation vs MV)        | Sprint 13    |
| 4 | Plaid sandbox vs production cutover timing                            | Sprint 14    |
| 5 | 2FA on login (Sprint 14 stretch — TOTP vs WebAuthn)                   | Sprint 14    |

---

## 13. Architecture Decision Records (index)

| ID  | Title                                                  | Status   |
|-----|--------------------------------------------------------|----------|
| 0001| Override DOC1 frontend choice — use Next.js 15 App Router | Accepted |
| 0002| Modular monolith, not microservices                    | Accepted |
| 0003| Three-layer tenant isolation with Postgres RLS         | Accepted |

Future ADRs go under `docs/adr/NNNN-title.md`.

---

## 14. Reading order for new engineers

1. This document (`ARCHITECTURE.md`).
2. `REPO_STRUCTURE.md` — where everything lives.
3. `MODULE_MAP.md` — what every module owns.
4. `DB_SCHEMA.md` — the data model.
5. `PERMISSION_MODEL.md` — RBAC + overrides.
6. `adr/0001`, `0002`, `0003` — the irreversible decisions.
7. The relevant module's `README.md` inside `apps/api/src/modules/<name>/`.
