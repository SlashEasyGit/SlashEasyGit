# ADR-0003 — Three-layer tenant isolation with Postgres Row-Level Security

- **Status:** Accepted
- **Date:** 2026-05-12
- **Confirms:** DOC1 §2.8, §6.2, §12.9

---

## Context

Tcharts is a SaaS where tenants (Tcharts Accounts) are separate businesses with separate accountants, separate books, and zero overlap. Within a tenant, multiple Companies exist with isolated financial data, and a user assigned to Company A must never see Company B's data unless explicitly assigned.

Cross-tenant or cross-company data leakage is **catastrophic** — financial confidentiality is the platform's promise. A single buggy `WHERE` clause without a `company_id` filter could expose every customer's books to every other customer.

We need an isolation strategy that:

1. Defends against application-code bugs (a forgotten `WHERE company_id = ?`).
2. Defends against ORM relation-load bugs (a Prisma `include` that misses a filter).
3. Defends against direct DB access by an engineer with prod credentials in an emergency.
4. Is cheap to operate (one Postgres database, not N databases).

## Decision

**Three-layer isolation. All three must hold; any one of them is a defense in depth for the others.**

### Layer 1 — Application guard (route)

Every controller route uses two decorators:

```ts
@RequireCompanyContext()                                  // verifies UserCompanyAccess exists and is active
@RequirePermission('revenue', 'enter_transactions')       // verifies effective permission for this user × company
@Post('invoices')
createInvoice(@Ctx() ctx: TenantContext, @Body() dto) {
  return this.invoicesService.create(ctx, dto);
}
```

`TenantContext` is request-scoped and carries `(userId, tchartsAccountId, currentCompanyId, role, effectivePermissions)`. It is built once per request by the `TenantContextMiddleware` from the access token + a fresh `user_company_access` check.

### Layer 2 — Repository assertion (data access)

Every repository method takes `companyId` as a required argument and asserts it matches `TenantContext.currentCompanyId`:

```ts
class InvoiceRepository {
  async findOne(ctx: TenantContext, invoiceId: string): Promise<Invoice | null> {
    return this.prisma.invoice.findFirst({
      where: { id: invoiceId, companyId: ctx.currentCompanyId },
    });
  }
}
```

`import/no-restricted-paths` in ESLint forbids repositories from being imported across module boundaries. Cross-module reads must go through the source module's public service, which in turn calls its own repositories. This means there is no path by which a Bill repository can be called with a Bill ID from one company and a Tenant context from another.

### Layer 3 — Postgres Row-Level Security (database)

Every company-scoped table has an RLS policy:

```sql
ALTER TABLE journal_entry ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entry FORCE ROW LEVEL SECURITY;

CREATE POLICY journal_entry_company_isolation ON journal_entry
  USING (company_id = current_setting('app.current_company_id')::uuid);
```

The connection-pool middleware sets the session variable at the start of every request's transaction:

```ts
await tx.$executeRawUnsafe(
  `SET LOCAL app.current_company_id = '${ctx.currentCompanyId}'`
);
```

`FORCE ROW LEVEL SECURITY` ensures the policy applies even to the table owner. The application connects as a non-superuser role (`tcharts_app`) that has no `BYPASSRLS` privilege.

A separate policy (`tcharts_account_isolation`) governs account-scoped tables like `user`, `user_company_access`, `refresh_token`:

```sql
CREATE POLICY user_account_isolation ON "user"
  USING (tcharts_account_id = current_setting('app.current_tcharts_account_id')::uuid);
```

The session variable is set in the same middleware step.

## Rationale

### Why RLS, not "we'll just be careful"

We will not just be careful. Every team eventually ships a query without the right `WHERE` clause. Examples seen in production at other SaaS companies:

- A new analyst adds a developer dashboard query that joins all tenants.
- A Prisma `include` pulls a related object that has no tenant guard.
- A debug endpoint left in code after a release.
- A migration script that operates across all tenants.

Each of these failures has happened publicly at named SaaS companies. RLS makes the database refuse to return foreign rows even when the application asks for them.

### Why three layers, not just RLS

RLS alone isn't enough because:

- RLS does not prevent a query from *spending DB resources* on a wrong-tenant lookup (a denial-of-wallet attack). The app guard short-circuits earlier.
- RLS errors look like "no rows found", not "you're trying to read someone else's data". The app guard returns a 403 with an audit log entry.
- RLS depends on the session variable being set. If a connection bypasses the middleware (e.g., a worker job that didn't set the var), RLS would block everything — but a bad worker could *set the wrong var*. Defense in depth.

### Why not one database per tenant

DOC1 §6.1 analysed this; the verdict is unchanged:

- **Migration pain.** O(N tenants) migrations on every schema change. Tcharts is changing every sprint for a year.
- **Cross-tenant ops queries** (billing, support, debugging) become heroic.
- **Cost.** Postgres per-tenant doesn't pay for itself until you have either a regulatory requirement or thousands of large tenants.

Per-tenant database remains an option we may execute for specific compliance-sensitive customers post-GA, implementable as a logical-database split without code rewrites.

## Consequences

### Tables that must enable RLS

Every table with `company_id` or `tcharts_account_id` as a column.

Generated lists (will be maintained in `packages/db/prisma/migrations/`):

- Company-scoped: `company_settings`, `chart_of_account`, `period_control_log`, `approval_workflow`, `approval_request`, `journal_entry`, `journal_entry_line`, `audit_log` (when `company_id IS NOT NULL`), `sales_tax`, `sales_tax_log`, `folder`, `document`, `attachment`, `task_group`, `task`, `sub_task`, `notes_folder`, `accounting_hub_note`, `conversation`, `conversation_participant`, `message`, `message_seen`, `customer`, `vendor`, `invoice`, `invoice_line`, `sales_order`, `sales_order_line`, `bill`, `bill_line`, `purchase_order`, `purchase_order_line`, `bank_account`, `bank_feed_transaction`, `reconciliation`, `reconciliation_match`.
- Account-scoped: `user`, `user_company_access`, `user_permission_override`, `tcharts_account`, `refresh_token`, `password_reset_token`, `invitation`.
- Public (no RLS): `role`, `permission`, `role_permission` (reference data shared across all tenants).

### The session variable contract

- **Set on every request**, in the auth middleware, before any module code executes.
- **Set inside a transaction** (`SET LOCAL`), so it auto-resets when the transaction ends.
- For worker jobs, the job payload carries `companyId` + `tchartsAccountId`; the job runner sets the session variables before invoking the module service.
- Connections returned to the pool **never** carry session variables across requests — `SET LOCAL` ensures this. Verified by an integration test that pulls a connection from the pool and asserts the session variables are unset.

### Failure modes and how we test them

| Failure                                                              | What QA verifies                                                                                |
|----------------------------------------------------------------------|-------------------------------------------------------------------------------------------------|
| Engineer writes a query without `company_id` filter                  | Test (DOC2 TC-S2-ISO-001): user in Company A lists `/invoices`, never sees Company B's rows.    |
| Engineer uses Prisma `include` without filter                        | Same. Property test enumerates every relation.                                                  |
| Worker job doesn't set session variable                              | Integration test (DOC2 TC-S2-ISO-004): with `app.current_company_id` unset, query returns 0 rows. |
| Tampered `currentCompanyId` in JWT                                   | Test (DOC2 TC-S2-ISO-002): user manually sets currentCompanyId to a company they aren't in → 403. |
| Two Tcharts Accounts have an account named "Sales" with the same ID  | Test (DOC2 TC-S2-ISO-003): neither account's user ever sees the other's. (UUIDs eliminate ID collisions; RLS eliminates row-level leakage.) |

### Performance impact

RLS adds a predicate to every query. Postgres folds it into the query plan and we ensure every relevant index leads with `company_id`. Measured overhead in benchmarks is <2% on typical tenant-scoped queries. Acceptable.

### Operational caveat

When a Tcharts engineer connects to prod for break-glass debugging, they connect as a role *without* `BYPASSRLS`. To inspect a specific tenant's data, they `SET LOCAL app.current_company_id = '...'` themselves, which is logged. Direct cross-tenant queries are not possible without escalating to a separate `tcharts_admin` role, which requires two-person approval and is audited.

## References

- DOC1 §2.8 (three layers)
- DOC1 §6.1, §6.2 (RLS strategy)
- DOC1 §12.9 (tenant isolation protection)
- DOC1 §13.2 (cross-tenant leakage risk — likelihood Low, impact Catastrophic)
- DOC2 §I.E AC-INT-13 (tenant isolation rule, tested every sprint)
- DOC2 §2 TC-S2-ISO-001..004 (isolation test suite)
