# Tcharts — Security Baseline & Threat Model

> **Status:** Draft v0.1 (Sprint 0). Updated each sprint as new modules introduce surface area.
> **Read first:** `ARCHITECTURE.md`, `adr/0003-tenant-isolation-rls.md`, `PERMISSION_MODEL.md`

This document captures the security baseline every release must clear and the threat model we built the architecture against. It is the input to the Sprint 16 pen-test scope.

---

## 1. Threat model — assets and adversaries

### Assets, ranked by sensitivity

1. **Financial books of every tenant.** General ledger, journal entries, period close state. Loss or corruption is catastrophic and unrecoverable from a customer-trust perspective.
2. **Audit logs.** Tamper-evidence is a regulatory requirement.
3. **PII.** User name, email, phone, IP, login history.
4. **Payment data placeholders.** Bank account numbers (last-4 only stored), Plaid/Stripe/Melio tokens (never the raw account details — those live with the provider).
5. **Tenant configuration.** Sales tax rates, COA, approval workflows. Less sensitive than the books, but corruption of COA cascades.
6. **Documents.** Uploaded PDFs, invoices, tax filings. May themselves contain PII.
7. **Internal-only data.** Feature flags, error logs.

### Adversaries

1. **External attacker on the public internet.** Most common, lowest skill. Mitigated by: ALB + Cloudflare WAF, strict CORS, auth on every endpoint, rate limiting, OWASP top-10 baseline, dependency vulnerability scanning, monitored Sentry alerts.
2. **Authenticated customer probing other customers' data.** Mitigated by: three-layer tenant isolation (ADR-0003), permission resolution audit, integration tests that explicitly attempt cross-tenant reads.
3. **Authenticated customer probing other companies within their own tenant.** Mitigated by: same as #2, plus per-user-per-company permission overrides, audit log on every permission change.
4. **Malicious or careless customer admin within their own tenant.** Mitigated by: Primary Admin actions are audit-logged, Hard Close requires reason on unlock, posted transactions cannot be hard-deleted.
5. **Insider — Tcharts engineer with prod credentials.** Mitigated by: least-privilege IAM via SSO, no `BYPASSRLS` on the application DB role, break-glass procedure with two-person approval for `tcharts_admin` role, all admin DB access logged.
6. **Supply chain (vulnerable dependency).** Mitigated by: Snyk + Dependabot, weekly review, signed releases, SBOM produced per build.
7. **Stolen device / session theft.** Mitigated by: 15-min access token TTL, refresh-token rotation with reuse detection, sessions listable + revocable in Profile Settings, IP/UA anomaly detection (Sprint 14+).

---

## 2. Defense layers — at a glance

```
                Internet
                   │
       ┌───────────┴───────────┐
       │ Cloudflare WAF + DDoS │
       └───────────┬───────────┘
                   │
       ┌───────────┴───────────┐
       │  AWS WAF (ALB rules)  │  (rate limit, bot mgmt, OWASP rules)
       └───────────┬───────────┘
                   │
        ┌──────────┴──────────┐
        │   ALB + TLS 1.3     │  (cert via ACM)
        └──────────┬──────────┘
                   │
                   ▼
   ┌──────────────────────────────┐
   │  NestJS API security chain   │
   │  ┌────────────────────────┐  │
   │  │ 1. Request-ID          │  │
   │  │ 2. Helmet (security    │  │
   │  │    headers)            │  │
   │  │ 3. CORS allowlist      │  │
   │  │ 4. Rate limit          │  │
   │  │ 5. Auth guard          │  │
   │  │ 6. Tenant context      │  │
   │  │ 7. RLS session var     │  │
   │  │ 8. Permission guard    │  │
   │  │ 9. Idempotency         │  │
   │  │ 10. Zod validation     │  │
   │  └────────────────────────┘  │
   └──────────────┬───────────────┘
                  │
                  ▼
       ┌──────────────────────┐
       │  Postgres RLS layer  │
       └──────────────────────┘
```

A request must pass **all** layers. Any layer alone is insufficient; together they form defense in depth.

---

## 3. Authentication

Per DOC1 §3.9, §7.1, and ADR-0001 (auth adapted for Next.js):

| Concern                       | Control                                                              |
|-------------------------------|----------------------------------------------------------------------|
| Password hashing              | bcrypt, cost factor 12 (verified by unit test on hashing utility)    |
| Password policy               | ≥12 chars, ≥1 letter, ≥1 number, ≥1 symbol; blocklist top-10k passwords |
| Phone OTP                     | Twilio Verify; 6-digit code; 10-min TTL; max 3 wrong attempts then session invalidated |
| Access token                  | RS256, 15-min TTL, in-memory only on web (never `localStorage`)      |
| Refresh token                 | Opaque 32-byte, 30-day rolling, `HttpOnly; Secure; SameSite=Strict` cookie scoped to web origin |
| Refresh token rotation        | On every refresh, old token is revoked; reuse of a revoked token revokes **all** the user's sessions and emails them |
| Token storage on web          | Access token in memory only. Refresh token in HttpOnly cookie. Both invalidated on logout. |
| Logout                        | Revokes the refresh token; subsequent refreshes fail                 |
| Password reset                | Single-use token, 1-hour TTL. Reset invalidates all active sessions. |
| Account lockout               | 10 failed logins within 15 min → 15-min lockout + email alert        |

Brute-force protection is rate-limit-first (5/min/IP, then per-user). After 10 failed logins, account is locked **regardless** of IP source.

---

## 4. Authorization

See `PERMISSION_MODEL.md` for full details. Summary:

- Every endpoint requires authentication unless explicitly `@Public()` (login, signup, public health).
- Every company-data endpoint requires `@RequireCompanyContext()` + `@RequirePermission(...)`.
- The `currentCompanyId` claim in the JWT is **always cross-checked** with `user_company_access` on every request — never trusted blindly.
- Primary Admin bypasses permission resolution but **does not bypass authentication** (still needs a valid token).

---

## 5. Input validation and output filtering

- **Input:** Zod schemas at the API boundary. Unknown fields are stripped (or rejected, depending on the endpoint). Strict types on every field. Lengths enforced (`max(500)` on text fields, etc.).
- **DTO whitelisting:** request bodies cannot set `companyId`, `tchartsAccountId`, `userId`, `createdBy`, `createdAt`, `id` — the server derives these. Mass-assignment is impossible by construction because the DTOs simply don't have those fields.
- **Output:** Response DTOs strip server-only fields. Passwords, password hashes, and tokens are never serialised under any code path. A property test enumerates all response DTOs and asserts they don't include sensitive field names.

---

## 6. Cryptography

| Use                 | Algorithm                                              | Key management                                 |
|---------------------|--------------------------------------------------------|------------------------------------------------|
| JWT                 | RS256 (2048-bit RSA)                                   | Private key in AWS Secrets Manager, rotated 90 days with grace period |
| Password hashing    | bcrypt, cost 12                                        | n/a (one-way)                                  |
| Field-level encryption (phone, tax IDs of companies) | AES-256-GCM           | KMS CMK; envelope encryption                   |
| TLS                 | TLS 1.3 preferred, 1.2 minimum                         | ACM-issued certs, auto-renewed                 |
| Random IDs          | UUIDv7 (monotonic, time-ordered) via `uuid` npm package | n/a                                         |
| Session tokens      | 32 bytes from `crypto.randomBytes`, base64url-encoded  | Hashed before storage; comparison is constant-time |

**No custom crypto.** No XOR, no homegrown hashes, no rolled-our-own random. Every primitive comes from `node:crypto` or a vetted library.

---

## 7. Secrets management

- **All secrets in AWS Secrets Manager.** Never in code, env files (beyond `.env.example`), or container images.
- **ECS task definitions** inject secrets at task start via the native Secrets Manager integration.
- **Local dev:** `.env` files (gitignored), seeded from `.env.example` with dev-only fake values.
- **Rotation:** 90 days for non-customer-impacting secrets (JWT signing keys with grace period, internal service tokens). Manual for customer-impacting (DB passwords) with maintenance window.
- **Pre-commit hook:** `gitleaks` scans for inadvertent secret commits. CI runs the same check on PR.

---

## 8. Network and infrastructure

| Control                | Detail                                                                                          |
|------------------------|-------------------------------------------------------------------------------------------------|
| VPC                    | API + worker + web tasks in private subnets; RDS + ElastiCache in DB subnets with no IGW route  |
| Security groups        | ALB → web (8080), web → api (8080), api → RDS (5432), api → ElastiCache (6379). No other inbound on the data plane. |
| RDS encryption at rest | KMS-encrypted                                                                                   |
| RDS TLS                | Required for all connections (`rds.force_ssl=1`)                                                |
| ElastiCache encryption | At rest and in transit                                                                          |
| R2                     | Bucket-level access controls; **presigned URLs only**; API never proxies bytes                  |
| IAM                    | Per-service roles; no wildcard policies; no IAM users for engineers (SSO)                       |
| SSH access             | None to ECS Fargate tasks. Debugging via CloudWatch Logs + Sentry. SSM Session Manager to a dedicated bastion if absolutely required, audited. |
| Secrets in transit     | TLS for everything internal                                                                     |

---

## 9. OWASP Top 10 (2021) — coverage map

| Risk                                          | Status   | Specific control                                                                 |
|-----------------------------------------------|----------|----------------------------------------------------------------------------------|
| A01 — Broken Access Control                   | Mitigated | RLS + app guards + per-route permission decorators; full coverage test suite     |
| A02 — Cryptographic Failures                  | Mitigated | TLS everywhere, bcrypt for passwords, KMS for secrets, AES-256-GCM for field-level |
| A03 — Injection                               | Mitigated | Prisma parameterised queries; Zod validation; no raw SQL with interpolation      |
| A04 — Insecure Design                         | Mitigated | This document + ADRs; security review for each new module                        |
| A05 — Security Misconfiguration               | Mitigated | Terraform-managed infra; CIS-benchmarked container images; Helmet defaults       |
| A06 — Vulnerable and Outdated Components      | Mitigated | Dependabot + Snyk; weekly review; CI blocks on High/Critical                     |
| A07 — Identification and Authentication Failures | Mitigated | Per §3 above; rate-limited auth; OTP; rotated refresh tokens                   |
| A08 — Software and Data Integrity Failures    | Mitigated | Signed releases; SBOM per build; CI verifies lockfile integrity                  |
| A09 — Security Logging and Monitoring Failures| Mitigated | Structured logs; immutable audit log table; Sentry; CloudWatch alarms            |
| A10 — Server-Side Request Forgery             | Mitigated | Outbound HTTP only through explicit allowlist (Twilio, Plaid, Melio, Stripe, R2, SES); URL parser rejects internal IP ranges |

---

## 10. Specific protections

### 10.1 SQL injection

- **All DB access is via Prisma.** No raw SQL with string interpolation.
- The exceptions (RLS DDL in migrations, sum-zero trigger function) are written as static SQL with no user input.
- Lint rule rejects `$queryRawUnsafe` outside of migration files.

### 10.2 XSS

- React escapes by default. No `dangerouslySetInnerHTML` outside vetted, sanitised renderers (rich-text notes use a sanitiser allowlist).
- Strict CSP header on web responses:
  ```
  Content-Security-Policy:
    default-src 'self';
    script-src 'self';
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: https://*.r2.cloudflarestorage.com;
    connect-src 'self' https://api.tcharts.app wss://api.tcharts.app https://*.posthog.com;
    frame-ancestors 'none';
  ```
- All user-generated text is HTML-escaped on output. Rich-text content goes through `DOMPurify` with an allowlist before storage.

### 10.3 CSRF

- Refresh token cookie is `SameSite=Strict`. The web app's refresh handler also requires a custom header (`X-Requested-With: XMLHttpRequest`) which the Next.js fetch wrapper sets.
- The API uses Bearer tokens, not cookies, so it is **immune to CSRF** by design.

### 10.4 Mass assignment

- DTOs explicitly list allowed fields. No `Object.assign(entity, body)`, no `prisma.entity.create({ data: body })` without explicit field selection.
- ESLint rule flags any spread (`...body`) on Prisma `create`/`update` calls.

### 10.5 IDOR (Insecure Direct Object Reference)

- All resource lookups go through repositories that take `companyId` from `TenantContext` and filter on it.
- RLS provides the second layer.
- When a resource isn't found, the API returns **404 NOT_FOUND**, not 403, to avoid leaking existence of cross-tenant resources. (We don't say "this exists but you can't see it"; we say "this doesn't exist for you".)

### 10.6 Open redirect

- The `redirect_to` query param on the login screen is allowlist-validated: only paths starting with `/companies/`, `/account`, or `/dashboard` are honoured. Absolute URLs or path-traversal patterns redirect to `/dashboard` instead.

### 10.7 Deserialisation

- Only JSON. No XML, no pickle, no eval'd code. JSON parsing limits depth (default Node settings) and total size (Fastify's `bodyLimit` set to 1 MB on most endpoints, 50 MB on multipart file upload endpoints).

---

## 11. File upload security

- Uploads go **directly to Cloudflare R2 via presigned URLs**. The API never proxies bytes — it just issues a 15-minute presigned URL.
- File type allowlist: `application/pdf`, `image/*`, `text/csv`, common Office formats. No executables (`.exe`, `.sh`, `.bat`, `.com`, `.scr`).
- Per-file size limit: 50 MB. Per-tenant storage quota: configurable, default 50 GB.
- Object keys: `tenant/{tchartsAccountId}/company/{companyId}/module/{module}/{uuid}-{filename}` — gives per-tenant pruning and prevents key collisions.
- All filenames sanitised at upload: removed path separators, no leading dots, no NTFS-reserved characters.
- Antivirus scanning (Sprint 15+ stretch): R2 webhook triggers a scan; infected files moved to a quarantine bucket and the row marked `quarantined` so download is blocked.

---

## 12. Logging and audit

- **Application logs (Pino → CloudWatch):** include `requestId`, `userId`, `tchartsAccountId`, `companyId`, `route`, `latencyMs`, `statusCode`. **Never** include access tokens, refresh tokens, password fields, OTP codes — enforced by Pino redaction list.
- **Audit log (`audit_log` table):** every financial mutation, permission change, period-control action, role change, login, password event. Append-only. The application role has only `INSERT` and `SELECT` on this table.
- **Sentry:** error tracking with PII scrubbing. Breadcrumbs respect the same redaction list as Pino.

The audit log is the regulatory record. Per DOC1 §6.7, retention is 7 years for financial events.

---

## 13. Data residency and GDPR

- v1 region: `us-east-1` for AWS, EU PostHog region for product analytics (no PII).
- DSR (data subject request) flow lands in Sprint 15: export user data per Tcharts Account, deletion (with 90-day soft-delete grace).
- No third-party analytics on the app surface (no Google Analytics, no Hotjar). PostHog is server-mediated for events that don't contain financial data.

---

## 14. Backup security

- RDS automated daily snapshots, KMS-encrypted with the same keys as the primary database.
- Weekly export to S3 Glacier, cross-region replicated to `us-west-2`, retained 1 year.
- R2 has 99.999999999% durability + we keep an additional weekly sync to S3 Glacier as a cross-provider safety net.
- Restoration drill: quarterly to a fresh RDS instance. RTO target: **4 hours**. RPO target: **15 minutes** (PITR).
- Backup restoration requires IAM permissions held by named engineers; rotated quarterly.

---

## 15. Incident response

Runbooks under `docs/runbooks/`:

- `INCIDENT.md` — paging procedure, severity classification, comms.
- `DISASTER_RECOVERY.md` — region failover, PITR, Stripe webhook repointing.
- `ROLLBACK.md` — ECS task definition revert + DB migration two-phase deploy notes.
- `ON_CALL.md` — rotation, escalation, expectations.

Severity classification:

| SEV | Definition                                                                 | Response time |
|-----|----------------------------------------------------------------------------|---------------|
| 1   | Customer data loss, exposure, or complete outage                            | < 15 min      |
| 2   | Significant feature broken for many tenants; auth failing; posting failing | < 1 hour      |
| 3   | Single tenant impacted, or non-critical feature broken                     | < 4 hours     |
| 4   | Cosmetic, minor, or single user                                            | Next business day |

---

## 16. Hardening checklist (per release)

Run before every production deploy. The pipeline blocks if any item is unchecked.

- [ ] All dependencies scanned (Snyk/npm audit): zero High/Critical
- [ ] Lockfile integrity verified (`pnpm install --frozen-lockfile` succeeded)
- [ ] OWASP ZAP baseline scan on staging: zero High findings
- [ ] Smoke E2E tests passed on staging
- [ ] RLS sweep test green (cross-tenant integration tests)
- [ ] Permission permutation suite green
- [ ] Migration is reversible (verified by CI `prisma migrate diff`)
- [ ] No `console.log`, `debugger`, `@ts-ignore`, or `eslint-disable` introduced
- [ ] Sentry release tagged

---

## 17. Open security items (deferred to specific sprints)

| Item                                                        | Sprint   |
|-------------------------------------------------------------|----------|
| 2FA on login (TOTP or WebAuthn)                             | S14 (stretch) |
| Audit log hash-chain (tamper evidence)                      | S15 (stretch) |
| Antivirus scanning for uploads                              | S15      |
| External pen-test                                           | S14–S16  |
| SOC 2 readiness work                                        | Post-GA  |

---

## 18. References

- DOC1 §7 (Auth & Authorization Plan)
- DOC1 §10.15 (Infrastructure Security)
- DOC1 §12 (Security Architecture Plan)
- DOC1 §13.1, §13.2 (Technical + security risks)
- DOC2 §16 (Security hardening test plan)
- ADR-0003 (Tenant isolation)
- `PERMISSION_MODEL.md`
