# Tcharts — Module Map

> **Status:** Draft v0.1 (Sprint 0)
> **Read first:** `ARCHITECTURE.md`, `REPO_STRUCTURE.md`

This document is the canonical inventory of NestJS modules in `apps/api/src/modules/`, what each module owns, what it publishes, and what it depends on. Use it as the rule-of-record when:

- Deciding which module a new endpoint or service belongs to.
- Reviewing a PR for module-boundary violations.
- Tracing why a downstream module needs to wait for an upstream module to be built.

---

## 1. Module inventory

| #  | Module                  | Sprint | Owns DB tables                                                                                          | Public surface (exported from `index.ts`)                                                                |
|----|-------------------------|--------|---------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------|
| 1  | `auth`                  | S1     | `refresh_token`, `password_reset_token`, `otp_session`                                                  | `AuthService.login()`, `AuthService.refresh()`, `AuthService.logout()`                                   |
| 2  | `tcharts-account`       | S2     | `tcharts_account`, `invitation`                                                                         | `TchartsAccountService.findById()`, `TchartsAccountService.transferPrimaryAdmin()`                       |
| 3  | `company`               | S2     | `company`                                                                                               | `CompanyService.create()`, `CompanyService.listForUser()`, `CompanyService.findById()`                   |
| 4  | `user-management`       | S2     | `user`, `user_company_access`                                                                           | `UserService.invite()`, `UserService.assignRole()`, `UserService.deactivate()`                           |
| 5  | `permission`            | S3     | `role`, `permission`, `role_permission`, `user_permission_override`                                     | `PermissionsService.resolveEffective(userId, companyId)`, `PermissionsService.setOverride()`             |
| 6  | `settings`              | S3     | `company_settings`, `user_profile_settings`                                                             | `SettingsService.getCompanySettings()`, `SettingsService.updateCompanySettings()`                        |
| 7  | `coa`                   | S5     | `chart_of_account`                                                                                      | `CoaService.list()`, `CoaService.findByNumber()`, `CoaService.assertActiveForPosting()`                  |
| 8  | `period-control`        | S4     | `period_control_log`                                                                                    | `PeriodControlService.assertCanPost()`, `PeriodControlService.applySoftClose()`, `applyHardClose()`, `unlock()` |
| 9  | `sales-tax`             | S6     | `sales_tax`, `sales_tax_log`                                                                            | `SalesTaxService.findActiveByState()`, `SalesTaxService.computeForLine()`                                |
| 10 | `approval-workflow`     | S4     | `approval_workflow`, `approval_request`                                                                 | `ApprovalWorkflowService.requiresApproval()`, `ApprovalWorkflowService.submit()`, `approve()`, `reject()` |
| 11 | `accounting-hub`        | S7-9   | `folder`, `document`, `attachment`, `task_group`, `task`, `sub_task`, `notes_folder`, `accounting_hub_note`, `conversation`, `conversation_participant`, `message`, `message_seen` | `DocumentsService`, `TasksService`, `CalendarService`, `NotesService`, `ChatService`                     |
| 12 | `company-dashboard`     | S10    | (read-only — no owned tables)                                                                           | `DashboardService.assemble(companyId, dateRange, role)`                                                  |
| 13 | `revenue`               | S11    | `customer`, `sales_order`, `sales_order_line`, `invoice`, `invoice_line`, `customer_payment`            | `CustomersService`, `InvoicesService`, `PaymentsService`                                                 |
| 14 | `expense`               | S12    | `vendor`, `purchase_order`, `purchase_order_line`, `bill`, `bill_line`, `bill_payment`                  | `VendorsService`, `BillsService`, `BillPaymentsService`                                                  |
| 15 | `general-ledger`        | S13    | (operates on `journal_entry`/`journal_entry_line` via shared service); `manual_journal_entry`, `budget` | `ManualJournalEntryService`, `BudgetService`                                                             |
| 16 | `banking`               | S14    | `bank_account`, `bank_feed_transaction`, `reconciliation`, `reconciliation_match`, `bank_rule`          | `BankAccountsService`, `ReconciliationService`                                                           |
| 17 | `reports`               | S13    | (read-only — materialized view `mv_account_period_balances`)                                            | `BalanceSheetService`, `ProfitLossService`, `TrialBalanceService`, `ArAgingService`, `ApAgingService`    |
| 18 | `audit-viewer`          | S15    | (read-only over `audit_log`)                                                                            | `AuditViewerService.query()`                                                                             |

---

## 2. Shared infrastructure modules

These live under `apps/api/src/shared/` and are **not** domain modules. They are cross-cutting infrastructure that domain modules consume.

| Module                          | Sprint | Owns DB tables             | Public surface                                                                                       |
|---------------------------------|--------|----------------------------|------------------------------------------------------------------------------------------------------|
| `shared/tenant-context`         | S2     | —                          | `TenantContext` (request-scoped), `@Ctx()` parameter decorator, `TenantContextMiddleware`            |
| `shared/journal-posting`        | S4     | `journal_entry`, `journal_entry_line` | `JournalPostingService.post(input)`, `JournalPostingService.reverse()`                              |
| `shared/audit-log`              | S4     | `audit_log`                | `AuditLogService.write()`, `AuditInterceptor`                                                        |
| `shared/idempotency`            | S4     | `idempotency_cache` (Redis-backed) | `IdempotencyInterceptor`                                                                            |
| `shared/notifications`          | S9+S15 | `notification`, `notification_preference` | `NotificationService.send()`, `NotificationService.fanout()`                                       |
| `shared/file`                   | S7     | (Cloudflare R2)            | `FileService.presignUpload()`, `FileService.presignDownload()`                                       |
| `shared/realtime`               | S9     | —                          | `RealtimeGateway` (Socket.IO), `RealtimeService.emitToCompany()`, `emitToUser()`                     |
| `shared/feature-flag`           | S0     | `feature_flag`             | `FeatureFlagService.isEnabled(tchartsAccountId, feature)`                                            |
| `shared/prisma`                 | S0     | —                          | `PrismaService` (Prisma client with RLS extensions)                                                  |
| `shared/redis`                  | S0     | —                          | `RedisService`                                                                                       |
| `shared/errors`                 | S0     | —                          | `AppError` hierarchy, `GlobalExceptionFilter`                                                        |
| `shared/logger`                 | S0     | —                          | Pino logger provider                                                                                 |
| `shared/health`                 | S0     | —                          | `/health`, `/ready` controllers                                                                      |

---

## 3. Inter-module dependency graph

The arrow direction is "imports from". A dotted arrow means "consumes domain events from" (no compile-time import).

```
                                  ┌────────────┐
                                  │  auth      │
                                  └─────┬──────┘
                                        │
                       ┌────────────────┼───────────────┐
                       ▼                ▼               ▼
              ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
              │tcharts-account│ │   company    │  │ user-mgmt    │
              └──────┬───────┘  └──────┬───────┘  └──────┬───────┘
                     │                 │                  │
                     └──────────┬──────┴──────────────────┘
                                ▼
                       ┌──────────────┐
                       │  permission  │
                       └──────┬───────┘
                              │
              ┌───────────────┼────────────────────┐
              ▼               ▼                    ▼
       ┌──────────────┐ ┌──────────────┐  ┌──────────────┐
       │  settings    │ │     coa      │  │ period-control│
       └──────────────┘ └──────┬───────┘  └──────┬───────┘
                               │                  │
                               └──────┬───────────┘
                                      ▼
                          ┌────────────────────────┐
                          │  approval-workflow     │
                          └───────────┬────────────┘
                                      │
                          ┌───────────┴────────────┐
                          ▼                        ▼
                ┌────────────────┐       ┌────────────────┐
                │ shared/journal-│◄──────│  sales-tax     │
                │   posting      │       └────────────────┘
                └───────┬────────┘
                        │
       ┌────────────────┼────────────────┬─────────────────┐
       ▼                ▼                ▼                 ▼
  ┌─────────┐      ┌─────────┐      ┌──────────┐      ┌─────────┐
  │ revenue │      │ expense │      │general-  │      │ banking │
  │         │      │         │      │  ledger  │      │         │
  └────┬────┘      └────┬────┘      └────┬─────┘      └────┬────┘
       │                │                │                  │
       └────────────────┴────────────────┴──────────────────┘
                              │
                              ▼  (via 'transaction.posted' events — dotted)
                       ┌──────────────┐    ┌──────────────┐
                       │   reports    │    │  company-    │
                       │              │    │  dashboard   │
                       └──────────────┘    └──────────────┘

  ┌────────────────────┐
  │ accounting-hub     │  (independent — depends only on company, user, file, realtime)
  └────────────────────┘
```

### Hard rules read from the graph

1. **Nothing posts to the books without going through `shared/journal-posting`.**
2. **`shared/journal-posting` calls `period-control.assertCanPost()` inside its transaction.** No module bypasses period control.
3. **`reports` and `company-dashboard` are read-only.** They cannot write to any table they don't own.
4. **`accounting-hub` is decoupled** from the accounting backbone. It can ship in Sprints 7–9 without blocking on Revenue/Expense.
5. **`auth` is leaf-level.** Every other module assumes `TenantContext` is available; `auth` is what produces it.

---

## 4. Module → DB table ownership table

A given table is **owned by exactly one module**. Other modules may read it through the owning module's public service, but never query it directly.

The owning module is the one with permission to write to the table. The `shared/journal-posting` module owns `journal_entry` and `journal_entry_line` — every domain module's posting service calls into journal-posting, never inserts to those tables directly.

| Table                          | Owned by                  | Read by (cross-module, via public service) |
|--------------------------------|---------------------------|--------------------------------------------|
| `tcharts_account`              | `tcharts-account`         | `auth`, `company-dashboard`, `settings`    |
| `user`                         | `user-management`         | `auth`, `permission`, `company-dashboard`  |
| `company`                      | `company`                 | everyone                                   |
| `user_company_access`          | `user-management`         | `auth`, `permission`                       |
| `company_settings`             | `settings`                | everyone                                   |
| `role`, `permission`, `role_permission` | `permission`     | (read-only reference data)                 |
| `user_permission_override`     | `permission`              | (read by `permission` only)                |
| `chart_of_account`             | `coa`                     | every transactional module, reports        |
| `period_control_log`           | `period-control`          | audit viewer                               |
| `sales_tax`, `sales_tax_log`   | `sales-tax`               | `revenue`                                  |
| `approval_workflow`            | `approval-workflow`       | every transactional module                 |
| `approval_request`             | `approval-workflow`       | `company-dashboard`                        |
| `journal_entry`, `journal_entry_line` | `shared/journal-posting` | `reports`, `company-dashboard`        |
| `audit_log`                    | `shared/audit-log`        | `audit-viewer`                             |
| `customer`                     | `revenue`                 | `company-dashboard`                        |
| `invoice`, `invoice_line`      | `revenue`                 | `company-dashboard`, `reports`             |
| `customer_payment`             | `revenue`                 | `banking`                                  |
| `vendor`                       | `expense`                 | `company-dashboard`                        |
| `bill`, `bill_line`            | `expense`                 | `company-dashboard`, `reports`             |
| `bill_payment`                 | `expense`                 | `banking`                                  |
| `bank_account`                 | `banking`                 | `coa`                                      |
| `bank_feed_transaction`        | `banking`                 | —                                          |
| `reconciliation`, `reconciliation_match` | `banking`       | —                                          |
| `folder`, `document`, `attachment` | `accounting-hub`      | every module that attaches files           |
| `task_group`, `task`, `sub_task` | `accounting-hub`        | `company-dashboard`                        |
| `accounting_hub_note`, `notes_folder` | `accounting-hub`    | —                                          |
| `conversation`, `message`, `conversation_participant`, `message_seen` | `accounting-hub` | `shared/realtime`, `company-dashboard` |
| `refresh_token`, `password_reset_token`, `otp_session` | `auth` | —                                |
| `invitation`                   | `user-management`         | —                                          |
| `feature_flag`                 | `shared/feature-flag`     | every module                               |

---

## 5. Module → permissions map

The `permission` table is seeded with one row per `(module, task)` from System Spec §3.6. The map below shows which module's endpoints check which permission.

Format: `permission_key → checking module`

| Permission key                                | Checked by module      |
|-----------------------------------------------|------------------------|
| `account.manage`                              | `tcharts-account`, `user-management`, `settings` (account-scoped settings) |
| `company.manage`                              | `company`              |
| `company.settings.edit`                       | `settings`             |
| `coa.view`, `coa.edit`                        | `coa`                  |
| `period-control.view`, `period-control.manage`| `period-control`       |
| `sales-tax.view`, `sales-tax.edit`            | `sales-tax`            |
| `revenue.view`, `revenue.enter_transactions`, `revenue.approve_transactions`, `revenue.view_reports` | `revenue` |
| `expense.view`, `expense.enter_transactions`, `expense.approve_transactions`, `expense.view_reports` | `expense` |
| `gl.view`, `gl.enter_journal`, `gl.view_reports` | `general-ledger`    |
| `banking.view`, `banking.reconcile`, `banking.pay_bills` | `banking`     |
| `hub.documents`, `hub.tasks`, `hub.calendar`, `hub.chat`, `hub.notes` | `accounting-hub` |
| `dashboard.view`                              | `company-dashboard`    |
| `audit-log.view`                              | `audit-viewer`         |

The full list of permission keys (≈40 of them) lives in `packages/domain/src/permissions.ts` as a string enum. The seed script in `packages/db/prisma/seed/role-permission-defaults.ts` populates the `role_permission` table from this enum + the default matrix from System Spec §3.6.

---

## 6. Module → sprint shipping order

This is the canonical sprint order from DOC1 §14. Modules whose name appears in a sprint are **built or significantly extended** that sprint.

| Sprint | Modules introduced or built                                                       |
|--------|-----------------------------------------------------------------------------------|
| S0     | `shared/prisma`, `shared/redis`, `shared/logger`, `shared/errors`, `shared/health`, `shared/feature-flag` (stub) |
| S1     | `auth`                                                                            |
| S2     | `tcharts-account`, `company`, `user-management`, `shared/tenant-context`          |
| S3     | `permission`, `settings`                                                          |
| S4     | `period-control`, `approval-workflow`, `shared/journal-posting`, `shared/audit-log`, `shared/idempotency` |
| S5     | `coa`                                                                             |
| S6     | `sales-tax`                                                                       |
| S7     | `accounting-hub/documents`, `shared/file`                                         |
| S8     | `accounting-hub/tasks`, `accounting-hub/calendar`, `accounting-hub/notes`         |
| S9     | `accounting-hub/chat`, `shared/realtime`, `shared/notifications` (in-app)         |
| S10    | `company-dashboard`                                                               |
| S11    | `revenue`                                                                         |
| S12    | `expense`                                                                         |
| S13    | `general-ledger`, `reports`                                                       |
| S14    | `banking`                                                                         |
| S15    | `shared/notifications` (email + preferences), `audit-viewer`, performance pass    |
| S16    | Hardening across all modules                                                      |

Why this order:

- **Guardrails (S3, S4) ship before transactions (S11+).** No module that posts to the books exists until period control, journal posting, audit log, idempotency, and approval workflow are reliable.
- **COA (S5) ships before Sales Tax (S6).** Sales Tax auto-creates a COA account.
- **The Hub (S7-9) ships before transactional modules** so module-folder auto-creation has somewhere to land.
- **Dashboard (S10) ships after the modules whose data it surfaces.** Building it earlier means rewriting it three times.

---

## 7. Cross-module communication patterns

### Pattern A — Synchronous public service call (most common)

```ts
// in expense/bill.service.ts
@Injectable()
export class BillService {
  constructor(
    private readonly coaService: CoaService,           // public service from coa module
    private readonly journalPosting: JournalPostingService,
    private readonly approval: ApprovalWorkflowService,
  ) {}

  async create(ctx: TenantContext, dto: CreateBillDto) {
    await this.coaService.assertActiveForPosting(ctx, dto.expenseAccountId);
    const requiresApproval = await this.approval.requiresApproval(ctx, 'bill');
    // ...
  }
}
```

### Pattern B — Domain event (when the caller doesn't need the receiver's response)

```ts
// in shared/journal-posting/journal-posting.service.ts — after successful post
this.events.emit('transaction.posted', {
  companyId: ctx.currentCompanyId,
  source: 'expense.bill',
  sourceId: bill.id,
  recognizeDate: bill.recognizeDate,
  total: bill.total,
});
```

```ts
// in company-dashboard/dashboard.cache.ts — consumer
@OnEvent('transaction.posted')
async invalidate(payload: TransactionPostedEvent) {
  await this.redis.del(`dashboard:${payload.companyId}`);
}
```

### Pattern C — Forbidden

```ts
// NEVER do this. The bills module reaches into accounting-hub's repository.
import { TaskRepository } from '../accounting-hub/tasks/task.repository';
// ESLint will reject this import via import/no-restricted-paths.
```

If `bill` needs to create a task on save, it calls `TasksService.create()` from `accounting-hub`'s public surface.

---

## 8. Module README contract

Every module under `apps/api/src/modules/<name>/` has a `README.md` with these sections:

```markdown
# <Name> module

## Purpose
One paragraph.

## Public surface
List the exports from index.ts. Method names and one-line descriptions.

## DB tables owned
List with one-line invariants.

## Permissions checked
List of permission keys this module's endpoints enforce.

## Dependencies (cross-module)
List of other modules whose public services this module imports.

## Domain events emitted
Event name, payload type, when fired.

## Domain events consumed
Event name, what the handler does.

## Key invariants
Module-specific things that must always hold.

## Open items / spec ambiguities
Anything pending clarification from the product spec.
```

CI lints for the existence of `README.md` in every module folder and refuses PRs that add a new module without one.
