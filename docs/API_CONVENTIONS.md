# Tcharts — API Conventions

> **Status:** Draft v0.1 (Sprint 0)
> **Read first:** `ARCHITECTURE.md`, `PERMISSION_MODEL.md`

The OpenAPI 3.1 document at `packages/contracts/src/openapi.yaml` is the **source of truth** for the API. The TypeScript client for the frontend and the request/response types for the backend are both generated from it. This document specifies the **conventions** the OpenAPI spec adheres to.

---

## 1. Versioning

URL prefix: `/api/v1/...`. Versioned in the URL, not the header.

We will not break v1 contracts. New functionality goes to v2 routes when v2 ships. Internal refactors that preserve the contract are unversioned.

Deprecation policy (post-GA): a deprecated endpoint emits `Deprecation: true` and `Sunset: <date>` response headers and remains live for **at least 6 months** before removal. Removal in v1 is forbidden.

---

## 2. URL shape

- Plural nouns: `/api/v1/invoices`, not `/api/v1/invoice`.
- Nested resources only one level deep:
  - `/api/v1/companies/:companyId/invoices` ✓
  - `/api/v1/companies/:companyId/customers/:customerId/invoices` ✗ — use `/invoices?customerId=...` instead.
- Verbs only as suffixes for non-CRUD actions: `/api/v1/invoices/:id/void`, `/api/v1/period-control/soft-close/apply`. CRUD uses HTTP methods.
- IDs are UUIDs in URLs. Never expose internal numeric IDs (we don't have any in v1, but as a future rule).

### Company scope in URLs

Endpoints that operate on company-scoped data have **`/companies/:companyId/...`** as a prefix. The companyId in the URL must match the `currentCompanyId` claim in the JWT — mismatch returns 403, **not 404**, to make the error specific.

Exceptions: account-scoped endpoints (auth, account settings, primary-admin transfer) live at `/api/v1/...` without the company prefix.

---

## 3. HTTP methods

| Method | Use                                                           | Body | Idempotent | Idempotency-Key required |
|--------|---------------------------------------------------------------|------|------------|--------------------------|
| GET    | List, retrieve                                                | No   | Yes        | No                       |
| POST   | Create, perform action                                        | Yes  | No*        | **Yes** if mutating      |
| PATCH  | Partial update                                                | Yes  | Yes        | Yes                      |
| PUT    | Full replacement                                              | Yes  | Yes        | Yes                      |
| DELETE | Soft-delete or terminal action                                | Sometimes | Yes  | Yes                      |

*POSTs become effectively idempotent via `Idempotency-Key` headers — see §7.

We prefer `PATCH` over `PUT` for updates. `PUT` reserved for full-resource replacement where the semantics are explicit (rare).

---

## 4. Request headers

Every authenticated request must carry:

| Header              | Purpose                                                        | Required when |
|---------------------|----------------------------------------------------------------|---------------|
| `Authorization`     | `Bearer <accessToken>`                                         | All authed endpoints |
| `X-Tcharts-Company` | The current company UUID                                       | Company-scoped endpoints (cross-checked against JWT) |
| `Idempotency-Key`   | Client-generated UUID                                          | All mutating endpoints |
| `X-Request-ID`      | Client-generated UUID for tracing                              | Optional; server generates one if missing |
| `Accept`            | `application/json`                                             | All endpoints |
| `Content-Type`      | `application/json` (or `multipart/form-data` for uploads)     | Bodied requests |

We do not use the `Authorization` cookie for the API. The refresh token cookie is for the web app's `/api/auth/refresh` Next.js route handler only.

---

## 5. Response envelopes

### Success — single resource

```json
{
  "data": { ... resource ... },
  "meta": { "requestId": "..." }
}
```

### Success — collection

```json
{
  "data": [ ... ],
  "meta": {
    "requestId": "...",
    "page": {
      "kind": "cursor",
      "nextCursor": "eyJpZCI6Ii4uLiJ9",
      "hasMore": true,
      "limit": 50
    }
  }
}
```

For offset-based pagination (used sparingly):

```json
{
  "data": [ ... ],
  "meta": {
    "requestId": "...",
    "page": {
      "kind": "offset",
      "page": 1,
      "perPage": 50,
      "total": 1247
    }
  }
}
```

### Error envelope

```json
{
  "error": {
    "code": "PERIOD_HARD_CLOSED",
    "message": "This period is Hard Closed. Unlock the period to continue.",
    "details": { "period": "2026-03-31" },
    "requestId": "01J..."
  }
}
```

- `code` is a **stable machine-readable** string. The frontend dispatches on `code`, never on `message`.
- `message` is the user-facing English message. It conforms to the **What / Why / How** error pattern from `DESIGN_SYSTEM.md` §10.4 where it makes sense.
- `details` is an object with structured per-error information. For validation errors, it contains a `fields` map. For business-rule errors, it contains the relevant entity references.

### Validation errors (special case)

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Some fields are invalid.",
    "details": {
      "fields": {
        "amount":  { "code": "TOO_LOW", "message": "Amount must be greater than 0." },
        "vendorId":{ "code": "REQUIRED", "message": "Vendor is required." }
      }
    },
    "requestId": "01J..."
  }
}
```

The frontend's `useApiError` hook unpacks `details.fields` into per-field React Hook Form errors.

---

## 6. Error code catalogue (cross-cutting)

These codes are part of the contract and stable. Module-specific codes are documented in each module's README.

| HTTP | Code                          | Meaning                                                            |
|------|-------------------------------|--------------------------------------------------------------------|
| 400  | `VALIDATION_ERROR`            | Request shape failed Zod validation                                |
| 400  | `BAD_REQUEST`                 | Other client-side input error                                      |
| 401  | `UNAUTHENTICATED`             | No / invalid access token                                          |
| 401  | `TOKEN_EXPIRED`               | Access token expired — client should refresh                       |
| 403  | `PERMISSION_DENIED`           | Authenticated but lacks the required permission                    |
| 403  | `COMPANY_ACCESS_DENIED`       | User is not assigned to the requested company                      |
| 403  | `SELF_APPROVAL_DENIED`        | Submitter tried to approve their own transaction                   |
| 404  | `NOT_FOUND`                   | Resource doesn't exist or is hidden from this role                 |
| 409  | `PERIOD_HARD_CLOSED`          | Recognize date falls in a Hard-Closed period                       |
| 409  | `PERIOD_SOFT_CLOSED`          | Recognize date falls in a Soft-Closed period for a non-Admin user  |
| 409  | `JE_UNBALANCED`               | Journal entry debits ≠ credits                                     |
| 409  | `ACCOUNT_INACTIVE`            | Line references an inactive COA account                            |
| 409  | `TAX_INACTIVE`                | Line references a deactivated sales tax                            |
| 409  | `IDEMPOTENCY_KEY_REUSE`       | Idempotency-Key reused with different body                         |
| 409  | `CONFLICT`                    | Other generic conflict (e.g., concurrent edit)                     |
| 422  | `BUSINESS_RULE_VIOLATION`     | Request shape valid, business rule failed                          |
| 429  | `RATE_LIMITED`                | Rate limit exceeded — see `Retry-After` header                     |
| 500  | `INTERNAL_ERROR`              | Unhandled server error — logged to Sentry, requestId returned      |
| 501  | `NOT_IMPLEMENTED`             | Feature not available yet (e.g., non-USD currency in v1)           |
| 503  | `SERVICE_UNAVAILABLE`         | Health check failing or planned maintenance                        |
| 507  | `STORAGE_QUOTA_EXCEEDED`      | Tenant has hit a storage limit                                     |

The full enum lives in `packages/domain/src/errors.ts`. Adding a new code requires a PR to that file *and* a documentation update here in the same PR.

---

## 7. Idempotency

Every mutating endpoint (`POST`, `PATCH`, `PUT`, `DELETE`) requires an `Idempotency-Key` header. The client generates a UUIDv4 per logical operation. The server:

1. Hashes `(method, path, body)` to a SHA-256 fingerprint.
2. Looks up `idempotency:{companyId}:{key}` in Redis.
3. If hit and fingerprint matches → return the cached response with the original status code. Cache TTL **24 hours**.
4. If hit and fingerprint **does not match** → `409 IDEMPOTENCY_KEY_REUSE`. The key was reused for a different request.
5. If miss → proceed. On success, cache the response body + status. On 5xx, **do not cache** (retry should attempt the work again).

The Redis cache is mirrored to the `idempotency_cache` Postgres table (write-behind) to survive Redis restarts.

Clients must:
- Generate a new key per logical operation.
- Reuse the key only when retrying the **same** operation due to transient failure.
- Never share keys across users or companies.

---

## 8. Pagination

Default: **cursor-based**. Cursor is an opaque base64-encoded string the client treats as a black box. The server encodes the last seen row's sort keys.

```
GET /api/v1/companies/:id/invoices?limit=50&cursor=eyJpZCI6Ii4uLiJ9&status=open
```

- `limit` — default 50, max 200.
- `cursor` — omitted for the first page.
- Response includes `meta.page.nextCursor` (null when exhausted) and `meta.page.hasMore`.

For lists where the **total count matters to the UI** (admin tables with "X total" badges), offset pagination is supported with `?page=1&perPage=50`.

---

## 9. Filtering and sorting

- Filters: query params. Simple types (string, number, boolean, ISO date) only. Complex filters use POST to `/search` sub-resources.
- Sorting: `?sort=recognize_date,-amount` — comma-separated, `-` prefix for descending.
- All filters are documented per-endpoint in OpenAPI with `enum` constraints where applicable.

---

## 10. Date and money in JSON

- **Date-only fields** (e.g., `recognize_date`, `due_date`): ISO date `"2026-05-12"`.
- **Timestamp fields**: ISO 8601 with timezone, UTC `"2026-05-12T10:00:00.000Z"`.
- **Money fields**: string-encoded decimal with 4 decimal places: `"1234.5600"`. **Not a number.** JSON's IEEE 754 floats are not safe for money; we strip the precision risk at the wire.

Example invoice line:

```json
{
  "id": "0193a1...",
  "description": "Consulting hours",
  "quantity": "10.0000",
  "unitPrice": "150.0000",
  "subtotal": "1500.0000",
  "taxAmount": "108.7500",
  "total": "1608.7500"
}
```

The frontend uses the `Money` value object from `@tcharts/domain` to parse, arithmetic, and format these strings.

---

## 11. Health and readiness

- `GET /health` — always returns 200 with `{ "status": "ok", "buildSha": "..." }`. Used by ALB and uptime checks.
- `GET /ready` — returns 200 only when Postgres and Redis are reachable and migrations are at the expected version. Returns 503 otherwise. Used by ECS to gate task replacement.

---

## 12. Rate limiting

- Anonymous (auth endpoints): 5 req/min per IP per endpoint.
- Authenticated: 60 req/min per user per endpoint family.
- Heavy endpoints (reports, exports): 10 req/min per user.

Headers on every response:

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 47
X-RateLimit-Reset: 1715515200
```

429 responses include `Retry-After: <seconds>`.

---

## 13. CORS

- **API origin allowlist:** the production web origin (`https://app.tcharts.app`) and staging. No `*`. No wildcards.
- Credentials: `Access-Control-Allow-Credentials: true` for the auth refresh flow (which uses cookies). All other endpoints use Bearer tokens, not cookies.

---

## 14. WebSocket conventions

- One namespace: `/realtime`.
- Authentication: handshake `auth.token = accessToken`. Server validates JWT and verifies `user_company_access` against the company room being requested.
- Rooms: `company:{companyId}` and `user:{userId}`. Joining a `company:` room requires verifying the user has an active `user_company_access` for that company.
- Events:
  - `transaction.posted` → fan out to `company:{id}` (for dashboard refresh).
  - `approval.requested` → fan out to `user:{approverId}` + `company:{id}`.
  - `message.new` → fan out to `conversation:{id}` (a sub-room only conversation participants join).
- Server-debounced badge updates: at most 1 update per 500ms per company.

---

## 15. OpenAPI authoring rules

- Every endpoint has `operationId` in camelCase. The generated TS client method uses this name.
- Every parameter has a `description`.
- Every response status has a `content` schema + at least one `example`.
- Every error response references the cross-cutting `Error` schema, with the `code` field's value enumerated for that endpoint.
- No `additionalProperties: true` on request bodies. Unknown fields are rejected at validation.
- All schemas live under `components/schemas/`. No inline schemas.
- Schema names: PascalCase, suffix with `Request` / `Response` / `Dto` to disambiguate.

Spectral rules:

```yaml
extends: ["spectral:oas", "spectral:asyncapi"]
rules:
  operation-operationId: error
  operation-tag-defined: error
  operation-description: error
  oas3-server-trailing-slash: error
  contact-properties: error
  no-additional-properties-true: error  # custom rule
```

The Spectral config lives at `packages/contracts/.spectral.yaml`. CI fails if linting fails.

---

## 16. Breaking-change policy

A change is **breaking** if any of:
- A field is removed from a response shape.
- A field's type or format changes.
- A required request field is added.
- A response status that was previously returned is no longer returned.
- A new error `code` is introduced for an existing endpoint and the frontend doesn't already handle the catch-all.

Breaking changes go to v2 (a new URL prefix), not v1.

**Non-breaking** (allowed in v1):
- Adding a new optional request field.
- Adding a new field to a response shape (clients should ignore unknown fields).
- Adding a new endpoint.
- Adding a new error `code` to an existing endpoint **only if** the frontend's catch-all handler is sufficient (the breaking-change check considers this).

---

## 17. Examples — anatomy of a route

```yaml
# In openapi.yaml
paths:
  /companies/{companyId}/invoices:
    post:
      operationId: createInvoice
      summary: Create and post an invoice
      tags: [revenue]
      parameters:
        - $ref: '#/components/parameters/CompanyId'
        - $ref: '#/components/parameters/IdempotencyKey'
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateInvoiceRequest'
      responses:
        '201':
          description: Invoice created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/InvoiceResponse'
        '400':
          $ref: '#/components/responses/ValidationError'
        '401':
          $ref: '#/components/responses/Unauthenticated'
        '403':
          $ref: '#/components/responses/PermissionDenied'
        '409':
          description: Period closed or business rule violated
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
              examples:
                period_hard_closed:
                  value:
                    error:
                      code: PERIOD_HARD_CLOSED
                      message: "This period is Hard Closed. Unlock the period to continue."
                      details: { period: "2026-03-31" }
                      requestId: "01J..."
```

And the corresponding NestJS controller:

```ts
@Controller('companies/:companyId/invoices')
@ApiTags('revenue')
export class InvoicesController {
  @Post()
  @HttpCode(201)
  @RequireCompanyContext()
  @RequirePermission('revenue.enter_transactions')
  async create(
    @Ctx() ctx: TenantContext,
    @Body() dto: CreateInvoiceRequest,
    @Headers('idempotency-key') idemKey: string,
  ): Promise<InvoiceResponse> {
    return this.invoicesService.create(ctx, dto);
  }
}
```

The Zod schema, the OpenAPI schema, and the TS DTO are all generated from the same source in `packages/contracts/src/schemas/revenue.ts`. There is no manual duplication.
