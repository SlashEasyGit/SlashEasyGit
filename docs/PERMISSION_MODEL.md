# Tcharts — Permission Model

> **Status:** Draft v0.1 (Sprint 0)
> **Read first:** `ARCHITECTURE.md`, `DB_SCHEMA.md` §4, `adr/0003-tenant-isolation-rls.md`

This document specifies how permissions are defined, resolved, cached, and enforced across the platform. **It is the rule of record for any access-control decision.** If the resolved permission for a given request is ambiguous from a developer's perspective, they consult this document, not the code.

---

## 1. Roles

There are **exactly four roles** in v1. No custom roles. No additional roles will be added in v1 (per System Spec §3).

| Role             | Scope     | How many per Tcharts Account                  | Notes |
|------------------|-----------|-----------------------------------------------|-------|
| `Primary Admin`  | Account   | Exactly one, ever                             | Cannot be permission-restricted. Manages subscription. Transferable. |
| `Company Admin`  | Company   | Any number, any number of companies           | Full access within their company. Cannot create companies. Cannot access billing. |
| `Accountant`     | Company   | Any number, any number of companies           | All transactional tasks ON by default. Toggleable per permission per company. |
| `External User`  | Company   | Any number, any number of companies           | Restricted by default. Only `Approve Transactions` and `View Reports` in GL/Revenue/Expense. No Banking, no Accounting Hub, no Period Control, no Bank Balance. |

### Why these four

The roles match the real-world division of labour in a mid-market accounting team:

- **Primary Admin** is the owner of the Tcharts Account — typically the controller or the founder.
- **Company Admin** is the in-charge for a single company — typically a manager or senior bookkeeper.
- **Accountant** is the day-to-day bookkeeper / staff accountant.
- **External User** is a client, an auditor, a board member — someone who needs to *see* but not *do*.

Each role's defaults are tuned to the principle of least privilege for that persona.

---

## 2. Permissions

A **permission** is a `(module, task)` pair. Each pair is a row in the `permission` table.

The full enumeration (≈40 permissions) lives in `packages/domain/src/permissions.ts` as a TypeScript string enum. The seed script populates the `permission` table from this enum.

### Permission key format

`<module>.<task>` — e.g., `revenue.enter_transactions`, `banking.reconcile`, `period-control.manage`.

### Permission inventory

The matrix below is the **default-on/default-off matrix from System Spec §3.6**, seeded into `role_permission`. `Y` = granted by default, `N` = not granted, `—` = doesn't apply (e.g., External User cannot see Banking at all).

| Permission                              | Primary Admin | Company Admin | Accountant | External User |
|-----------------------------------------|---------------|---------------|------------|---------------|
| **Account-level**                       |               |               |            |               |
| `account.manage`                        | Y             | N             | N          | N             |
| `company.manage`                        | Y             | N             | N          | N             |
| `company.settings.edit`                 | Y             | Y             | N          | N             |
| `permission.override`                   | Y             | Y (within own company, not for PA-set overrides) | N | N |
| `user.invite`                           | Y             | Y             | N          | N             |
| `user.role.change`                      | Y             | Y (within own company) | N | N             |
| **COA**                                 |               |               |            |               |
| `coa.view`                              | Y             | Y             | Y          | Y             |
| `coa.edit`                              | Y             | Y             | Y          | N             |
| **Period Control**                      |               |               |            |               |
| `period-control.view`                   | Y             | Y             | N          | N             |
| `period-control.manage`                 | Y             | Y             | N          | N             |
| **Sales Tax**                           |               |               |            |               |
| `sales-tax.view`                        | Y             | Y             | Y          | N             |
| `sales-tax.edit`                        | Y             | Y             | N          | N             |
| **Revenue**                             |               |               |            |               |
| `revenue.view`                          | Y             | Y             | Y          | Y             |
| `revenue.enter_transactions`            | Y             | Y             | Y          | N             |
| `revenue.approve_transactions`          | Y             | Y             | Y          | Y             |
| `revenue.view_reports`                  | Y             | Y             | Y          | Y             |
| **Expense**                             |               |               |            |               |
| `expense.view`                          | Y             | Y             | Y          | Y             |
| `expense.enter_transactions`            | Y             | Y             | Y          | N             |
| `expense.approve_transactions`          | Y             | Y             | Y          | Y             |
| `expense.view_reports`                  | Y             | Y             | Y          | Y             |
| **General Ledger**                      |               |               |            |               |
| `gl.view`                               | Y             | Y             | Y          | Y             |
| `gl.enter_journal`                      | Y             | Y             | Y          | N             |
| `gl.view_reports`                       | Y             | Y             | Y          | Y             |
| **Banking**                             |               |               |            |               |
| `banking.view`                          | Y             | Y             | Y          | —             |
| `banking.reconcile`                     | Y             | Y             | Y          | —             |
| `banking.pay_bills`                     | Y             | Y             | Y          | —             |
| **Accounting Hub**                      |               |               |            |               |
| `hub.documents`                         | Y             | Y             | Y          | —             |
| `hub.tasks`                             | Y             | Y             | Y          | —             |
| `hub.calendar`                          | Y             | Y             | Y          | —             |
| `hub.chat`                              | Y             | Y             | Y          | —             |
| `hub.notes`                             | Y             | Y             | Y          | —             |
| **Dashboard**                           |               |               |            |               |
| `dashboard.view`                        | Y             | Y             | Y          | Y (filtered)  |
| `dashboard.view_bank_balance`           | Y             | Y             | Y          | N             |
| **Audit Log**                           |               |               |            |               |
| `audit-log.view`                        | Y             | N             | N          | N             |

"—" for External User in Banking and Hub means the **module is not even visible** in their UI (sidebar items omitted, route guards redirect to dashboard with a "not available for your role" toast). For External User in Dashboard, the role still has `dashboard.view` but `dashboard.view_bank_balance = N` — the Bank Balance widget is hidden specifically.

---

## 3. Effective permission resolution

For any `(userId, companyId, permissionKey)` triple, the **effective permission** is computed by this exact algorithm. The result is a boolean.

```
def resolve_effective(user, company, permission_key):
    # Step 0 — special case: Primary Admin
    if user.is_primary_admin and user.tcharts_account_id == company.tcharts_account_id:
        return True  # short-circuit; Primary Admin bypasses everything

    # Step 1 — find the user's role in this company
    access = user_company_access.find(
        user_id=user.id,
        company_id=company.id,
        status='active'
    )
    if not access:
        return False  # user not assigned to this company

    # Step 2 — default from role
    role_default = role_permission.find(
        role_key=access.role,
        permission_key=permission_key
    ).granted  # boolean

    effective = role_default

    # Step 3 — overlay Company Admin override (if any)
    ca_override = user_permission_override.find(
        user_id=user.id,
        company_id=company.id,
        permission_key=permission_key,
        overridden_by_role='Company Admin'
    )
    if ca_override:
        effective = ca_override.granted

    # Step 4 — overlay Primary Admin override (if any) — WINS
    pa_override = user_permission_override.find(
        user_id=user.id,
        company_id=company.id,
        permission_key=permission_key,
        overridden_by_role='Primary Admin'
    )
    if pa_override:
        effective = pa_override.granted

    return effective
```

### Hard rules

| # | Rule                                                                                                                            |
|---|---------------------------------------------------------------------------------------------------------------------------------|
| 1 | **Primary Admin always returns true** for every permission in every company in their Tcharts Account. They never go through resolution. |
| 2 | **Resolution is per `(user, company, permission)`.** The same user can have completely different effective permissions in different companies. |
| 3 | **Primary Admin override beats Company Admin override.** This is enforced at write time: a Company Admin cannot create or modify a row where `overridden_by_role = 'Primary Admin'`. |
| 4 | **Company Admin cannot override their own permissions.** They have full access by role; they cannot demote themselves. |
| 5 | **Company Admin cannot override a permission for a user in a company they do not admin.** Enforced at the API. |
| 6 | **No role inheritance.** Accountant defaults are independent of External User defaults. Adding a permission to Accountant does not add it to External User. |
| 7 | **No deny-by-default for unknown permissions.** If a permission key is not in the `role_permission` table, the lookup returns `false` and an error is logged. Reaching this path is a bug. |

---

## 4. Caching

Resolved effective permissions are cached in Redis to avoid hitting `user_company_access` + `role_permission` + `user_permission_override` on every request.

### Cache shape

Key: `perm:{userId}:{companyId}` — TTL **5 minutes**.

Value:

```json
{
  "role": "Accountant",
  "isPrimaryAdmin": false,
  "permissions": {
    "revenue.enter_transactions": true,
    "revenue.approve_transactions": true,
    "banking.reconcile": false,
    ...
  },
  "computedAt": "2026-05-12T10:00:00.000Z",
  "version": 1
}
```

Cached **per user × company**. A user assigned to N companies has N cache keys.

### Cache invalidation

Cache is invalidated on these events (synchronous delete in Redis):

| Event                                        | Cache keys invalidated                                  |
|----------------------------------------------|---------------------------------------------------------|
| `user.role.change` in company X              | `perm:{userId}:{X}`                                     |
| `user.permission.override.set` (or `.clear`) | `perm:{userId}:{X}`                                     |
| `user.company.access.revoke`                 | `perm:{userId}:{X}`                                     |
| `user.deactivate`                            | `perm:{userId}:*` (all companies)                       |
| Role/permission seed migration               | `perm:*` (entire prefix)                                |

In addition, Redis TTL of 5 minutes means even if invalidation is missed, the worst-case staleness is 5 minutes.

### Cache miss path

```
PermissionsService.resolveEffective(userId, companyId):
  1. GET perm:{userId}:{companyId} from Redis
  2. if hit → return cached
  3. if miss → query DB, compute effective map for ALL permissions, SET in Redis with TTL 300s, return
```

We compute the **entire permission map** for the user × company on miss, not one permission at a time, because the map is small (≈40 booleans) and the alternative is N round-trips to Redis per request.

---

## 5. Enforcement

### Backend — at the route

```ts
@Controller('invoices')
export class InvoicesController {
  @RequireCompanyContext()
  @RequirePermission('revenue.enter_transactions')
  @Post()
  async create(@Ctx() ctx: TenantContext, @Body() dto: CreateInvoiceDto) {
    return this.invoicesService.create(ctx, dto);
  }
}
```

`PermissionGuard` reads the decorator's permission key, calls `PermissionsService.resolveEffective(ctx.userId, ctx.currentCompanyId, key)`, and:

- If `true` → pass through.
- If `false` → throw `ForbiddenError('PERMISSION_DENIED', { permission: key })`.

### Backend — at the service (defense in depth)

Critical services (anything that posts to the books) re-check inside the service, not relying on the route guard:

```ts
async create(ctx: TenantContext, dto: CreateInvoiceDto) {
  await this.permissions.assert(ctx, 'revenue.enter_transactions');
  // ... rest of the method
}
```

This protects against the case where a service is reused from a context other than HTTP (e.g., a worker job calling the same service).

### Frontend — at the route

`apps/web/src/app/(authed)/companies/[companyId]/revenue/invoices/new/page.tsx`:

```tsx
'use client';
import { usePermission } from '@/hooks/usePermission';
import { Forbidden } from '@/components/patterns/Forbidden';

export default function NewInvoicePage() {
  const canEnter = usePermission('revenue.enter_transactions');
  if (!canEnter) return <Forbidden />;
  return <InvoiceForm />;
}
```

Server components do the same check in the layout, via `getEffectivePermissions()` on the server.

### Frontend — at the UI

Every button, link, and form action that triggers a permission-gated mutation is wrapped:

```tsx
<PermissionGate permission="revenue.enter_transactions">
  <Button onClick={openInvoiceForm}>New Invoice</Button>
</PermissionGate>
```

The gate hides the element entirely if the permission is denied. **No "disabled with tooltip" UX** — denied = invisible. Showing disabled buttons leaks the existence of features the user can't use.

Exception: Sidebar nav items for modules entirely hidden from a role (e.g., Banking for External User) are removed by the AppShell at render time, not gated per-item.

---

## 6. Module visibility

Some modules are not just permission-gated; they are **entirely hidden** from certain roles:

| Module          | Hidden from   | Effect                                                                                       |
|-----------------|---------------|----------------------------------------------------------------------------------------------|
| Banking         | External User | Sidebar item omitted. Direct URL → 404 (not 403, to avoid existence leakage).                |
| Accounting Hub  | External User | Sidebar item + Right Panel both omitted. Right Panel toggle button also hidden.              |
| Period Control  | Accountant, External User | Settings sub-menu item omitted. Direct URL → 404.                                |
| Audit Log       | non-Primary Admin | Reports sub-menu item omitted.                                                            |
| Bank Balance widget | External User | Dashboard renders without this widget; layout reflows.                                   |
| Trial / Subscription banner | non-Primary Admin | Banner not rendered.                                                                 |

These visibility rules are encoded in:
- `packages/domain/src/role-module-visibility.ts` — pure data table, single source of truth.
- Consumed by `AppShell` (sidebar build), `RightPanel` (visibility), and per-route layouts.

---

## 7. Special concerns

### 7.1 Primary Admin Transfer

When a Primary Admin is transferred (System Spec §4.5):

1. The outgoing PA **must** be reassigned a company + role before the transfer can complete. Enforced at the API.
2. The incoming user must have an active session (not deactivated).
3. The transfer is one transaction:
   - `tcharts_account.primary_admin_id` updates.
   - Outgoing PA's `user.is_primary_admin` set to false.
   - Incoming PA's `user.is_primary_admin` set to true.
   - A `user_company_access` row is inserted for the outgoing PA with their new role.
   - All `user_permission_override` rows for the outgoing PA where `overridden_by_role = 'Primary Admin'` are demoted to `overridden_by_role = 'Company Admin'` if and only if the demoting CA is in the same company. Otherwise, the override is **removed** (no orphaned overrides).
   - `audit_log` row written with `entity_type = 'TchartsAccount'`, `action = 'PRIMARY_ADMIN_TRANSFER'`.
4. Both users' permission caches are invalidated.
5. Email notifications sent to both.

A pessimistic lock on the `tcharts_account` row (`SELECT … FOR UPDATE`) prevents two simultaneous transfers.

### 7.2 External User restriction on `dashboard.view_bank_balance`

External User has `dashboard.view = Y` (so they can land on the dashboard) but `dashboard.view_bank_balance = N`. The dashboard endpoint returns widgets per permission; the Bank Balance widget is omitted from the response for External Users. The frontend computes the layout from the present widgets — no hidden empty cells.

### 7.3 The `approve own submission` rule

Approval workflows enforce that the user who submitted a transaction cannot approve it, regardless of permissions. This is a separate business rule, **not** a permission. Implemented as a DB CHECK on `approval_request`:

```sql
ALTER TABLE approval_request
  ADD CONSTRAINT approval_request_no_self_approval
  CHECK (submitted_by_user_id IS DISTINCT FROM approved_by_user_id);
```

And as a service-layer guard in `ApprovalWorkflowService.approve()`.

A user can have `revenue.approve_transactions = true` and still get rejected when trying to approve their own bill. The error code is `SELF_APPROVAL_DENIED`, distinct from `PERMISSION_DENIED`.

### 7.4 Hidden routes vs forbidden routes

- A route the user has no permission for: `403 PERMISSION_DENIED`.
- A route belonging to a module entirely hidden from the user's role: `404 NOT_FOUND` (intentional — does not leak that the module exists).

The frontend handles both: on 403, show a friendly "you don't have access to this" page with a link back to dashboard. On 404 from a known route the role can't see, show the same UI as for any 404.

### 7.5 Audit logging of permission changes

Every permission-related mutation writes `audit_log` with action one of:

- `PERMISSION_OVERRIDE_SET`
- `PERMISSION_OVERRIDE_CLEARED`
- `USER_ROLE_CHANGED`
- `USER_COMPANY_ACCESS_GRANTED`
- `USER_COMPANY_ACCESS_REVOKED`
- `PRIMARY_ADMIN_TRANSFERRED`

The `before_json` / `after_json` capture the full state of the override or the role assignment, so audit reviewers can reconstruct the chain.

---

## 8. Testing

The QA strategy (DOC2 §3) requires an exhaustive **permission permutation suite** that enumerates every `(role × override-by-CA × override-by-PA × permission)` tuple and asserts the resolved effective permission matches this document.

The harness lives at `apps/api/test/permission-permutations.test.ts`. It is regenerated whenever the permission inventory or the role-permission defaults change. CI fails if the harness's output deviates from the matrix in this document.

A second suite tests the **frontend** permission gates:

- `PermissionGate` hides children when permission is `false`.
- `usePermission` hook returns the cached effective permission.
- Route guards (server + client) redirect appropriately.

---

## 9. Known limitations / non-goals (v1)

- **No time-limited permissions.** A permission is granted until revoked.
- **No "any-of" or "all-of" permission combos at the route level.** Each route checks exactly one permission. If a route needs more, it composes a higher-level permission key.
- **No delegation.** A user cannot temporarily delegate their permissions to another user.
- **No custom roles.** Adding a new role requires a code change, a migration to seed `role_permission` defaults, and a release.
- **No org-wide permission templates.** Each user's overrides are individual.

These are non-goals for v1. Customer demand may push them into v2.

---

## 10. References

- DOC1 §1.6 (Permission architecture overview)
- DOC1 §7.3, §7.4, §7.5, §7.6 (RBAC + scope + inheritance + overrides)
- DOC1 §2.9 (User-role architecture)
- DOC2 §3 (Test plan for the permission engine)
- DOC2 §I.E AC-INT-16, AC-INT-17 (Resolution rule, Primary Admin override precedence)
- System Spec §3.6 (Role-permission default matrix — the source of truth)
- System Spec §3.7 (Override mechanics)
