# Tcharts — Environment & Configuration

> **Status:** Draft v0.1 (Sprint 0)

This document specifies how environment variables, secrets, and configuration are managed across the four environments.

---

## 1. Environments

| Name         | URL                              | Purpose                                | Data |
|--------------|----------------------------------|----------------------------------------|------|
| `local`      | `localhost:*`                    | Engineer's machine                     | docker-compose ephemeral, seeded |
| `dev`        | `app-dev.tcharts.app`            | Shared integration (post-GA)           | Shared DB, anonymized demo data |
| `staging`    | `app-staging.tcharts.app`        | Pre-prod verification                  | Mirrors prod config; smoke tests on every deploy |
| `production` | `app.tcharts.app`                | Customer-facing                        | Real data; Multi-AZ; daily PITR backups |

Each environment has its own AWS account where feasible.

---

## 2. Configuration sources, in precedence order

For any given setting, the value is resolved in this order. The first non-empty value wins.

1. **Code default** — checked into the repo for non-secret defaults (e.g., `MAX_UPLOAD_SIZE_BYTES=52428800`).
2. **Environment-specific code config** — `apps/api/src/config/<env>.ts`. Used for things that vary by environment but aren't secret (e.g., the public API base URL).
3. **Process environment variable** — `process.env.X`.
4. **AWS Secrets Manager** — for secrets, loaded into `process.env` at ECS task start via the task definition's `secrets` block.

For local dev, `.env` files at the repo root (and per-app where needed) load via `dotenv-flow` at boot. **`.env` is gitignored.** `.env.example` is committed as a template.

---

## 3. Validated config

Each app loads its env into a typed config object, validated with Zod at boot. Boot fails fast on invalid config.

```ts
// apps/api/src/config/env.ts
import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['local', 'dev', 'staging', 'production']),
  PORT: z.coerce.number().int().positive().default(8080),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  JWT_PRIVATE_KEY: z.string().min(100),        // PEM
  JWT_PUBLIC_KEY: z.string().min(100),
  JWT_ACCESS_TTL_SECONDS: z.coerce.number().int().positive().default(900),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(30),
  SENTRY_DSN: z.string().url().optional(),
  R2_ACCOUNT_ID: z.string(),
  R2_ACCESS_KEY_ID: z.string(),
  R2_SECRET_ACCESS_KEY: z.string(),
  R2_BUCKET: z.string(),
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_VERIFY_SERVICE_SID: z.string().optional(),
  SES_REGION: z.string().default('us-east-1'),
  ALLOWED_ORIGINS: z.string().transform(s => s.split(',').map(o => o.trim())),
  LOG_LEVEL: z.enum(['fatal','error','warn','info','debug','trace']).default('info'),
});

export const env = EnvSchema.parse(process.env);
export type Env = z.infer<typeof EnvSchema>;
```

---

## 4. Variable inventory

### Shared (all three apps)

| Variable          | Description                                          | Local default                  | Source in prod         |
|-------------------|------------------------------------------------------|--------------------------------|------------------------|
| `NODE_ENV`        | `local` \| `dev` \| `staging` \| `production`         | `local`                        | ECS task env           |
| `LOG_LEVEL`       | Pino log level                                       | `debug`                        | ECS task env           |
| `SENTRY_DSN`      | Sentry DSN per app                                   | (empty)                        | Secrets Manager        |
| `BUILD_SHA`       | Git SHA at build time, baked into the image          | (empty)                        | CI populates           |

### `apps/api/`

| Variable                       | Description                                      | Local default                                    | Source in prod  |
|--------------------------------|--------------------------------------------------|--------------------------------------------------|-----------------|
| `PORT`                         | HTTP port                                        | `8080`                                           | ECS task env    |
| `DATABASE_URL`                 | Postgres connection string                       | `postgres://tcharts:tcharts@localhost:5432/tcharts_dev` | Secrets Manager |
| `REDIS_URL`                    | Redis connection string                          | `redis://localhost:6379/0`                       | Secrets Manager |
| `JWT_PRIVATE_KEY`              | RS256 private key (PEM)                          | (generated on first boot for local)              | Secrets Manager |
| `JWT_PUBLIC_KEY`               | RS256 public key (PEM)                           | (matching above)                                 | Secrets Manager |
| `JWT_ACCESS_TTL_SECONDS`       | Access token TTL                                 | `900`                                            | Code default    |
| `REFRESH_TOKEN_TTL_DAYS`       | Refresh token TTL                                | `30`                                             | Code default    |
| `BCRYPT_COST`                  | Password hashing cost                            | `12`                                             | Code default    |
| `R2_ACCOUNT_ID`                | Cloudflare R2 account ID                         | (dev R2 account)                                 | Secrets Manager |
| `R2_ACCESS_KEY_ID`             | R2 access key ID                                 | (dev key)                                        | Secrets Manager |
| `R2_SECRET_ACCESS_KEY`         | R2 secret access key                             | (dev key)                                        | Secrets Manager |
| `R2_BUCKET`                    | R2 bucket name                                   | `tcharts-dev`                                    | ECS task env    |
| `TWILIO_ACCOUNT_SID`           | Twilio account SID (for OTP)                     | (test creds)                                     | Secrets Manager |
| `TWILIO_AUTH_TOKEN`            | Twilio auth token                                | (test creds)                                     | Secrets Manager |
| `TWILIO_VERIFY_SERVICE_SID`    | Twilio Verify service SID                        | (test SID)                                       | Secrets Manager |
| `SES_REGION`                   | AWS region for SES                               | `us-east-1`                                      | ECS task env    |
| `SES_FROM_ADDRESS`             | From address for transactional email             | `noreply@tcharts.app`                            | ECS task env    |
| `ALLOWED_ORIGINS`              | CORS allowlist, comma-separated                  | `http://localhost:3000`                          | ECS task env    |

### `apps/worker/`

Inherits everything from `apps/api/` (same Postgres, same Redis, same secrets) plus:

| Variable                        | Description                                             | Default |
|---------------------------------|---------------------------------------------------------|---------|
| `WORKER_CONCURRENCY_DEFAULT`    | Default per-queue concurrency                           | `5`     |
| `WORKER_AUDIT_FLUSH_INTERVAL_MS`| Interval for batched audit log flushes                  | `5000`  |

### `apps/web/`

| Variable                       | Description                                          | Local default              | Source in prod    |
|--------------------------------|------------------------------------------------------|----------------------------|-------------------|
| `PORT`                         | Next.js port                                         | `3000`                     | ECS task env      |
| `NEXT_PUBLIC_API_URL`          | Public API base URL (bundled into client)            | `http://localhost:8080`    | Build-time env    |
| `NEXT_PUBLIC_SENTRY_DSN`       | Sentry DSN for client-side                           | (empty)                    | Build-time env    |
| `NEXT_PUBLIC_POSTHOG_KEY`      | PostHog public key                                   | (empty)                    | Build-time env    |
| `NEXT_PUBLIC_POSTHOG_HOST`     | PostHog host (EU region)                             | `https://eu.posthog.com`   | Build-time env    |
| `INTERNAL_API_URL`             | Server-side API base URL (RSC, route handlers)       | `http://localhost:8080`    | ECS task env      |
| `COOKIE_DOMAIN`                | Cookie domain for refresh tokens                     | `localhost`                | ECS task env      |
| `SESSION_SECRET`               | Server-side session signing secret                   | (random per boot in local) | Secrets Manager   |

**`NEXT_PUBLIC_*` variables** are baked into the client bundle at build time. They are **not secrets** — anything in the client bundle is public.

The **`INTERNAL_API_URL`** is the server-side route handlers' API URL. In production this is the internal ALB hostname (no internet hop). In local it matches `NEXT_PUBLIC_API_URL`.

---

## 5. Secrets management

### Production

All secret values live in **AWS Secrets Manager**, one secret per logical group:

- `tcharts/prod/database` — `DATABASE_URL`, master + read-replica URLs.
- `tcharts/prod/redis` — `REDIS_URL`.
- `tcharts/prod/jwt` — `JWT_PRIVATE_KEY`, `JWT_PUBLIC_KEY` (rotated quarterly with overlap).
- `tcharts/prod/r2` — R2 credentials.
- `tcharts/prod/twilio` — Twilio credentials.
- `tcharts/prod/stripe` — Stripe webhook secret + API key.
- `tcharts/prod/plaid` — Plaid client ID + secret.
- `tcharts/prod/melio` — Melio API credentials.
- `tcharts/prod/sentry` — Sentry DSNs (technically not secret, but managed here for consistency).
- `tcharts/prod/session` — `SESSION_SECRET` for the web app.

ECS task definitions reference these via the `secrets:` block, which injects them into `process.env` at task start. The task role has `secretsmanager:GetSecretValue` only for the specific secret ARNs it needs (least privilege).

### Local

`.env` files at the repo root (gitignored). Seeded from `.env.example`:

```bash
cp .env.example .env
# fill in any values you need; most have working defaults for docker-compose
```

For developer testing of Twilio/Stripe/Plaid integrations, use **sandbox/test credentials** and document the values in `.env.example` as comments (commented out — engineer must opt in).

### Rotation policy

| Secret type                       | Rotation interval | Method                                                  |
|-----------------------------------|-------------------|---------------------------------------------------------|
| DB password                       | 90 days           | Manual with maintenance window; Secrets Manager automatic rotation Lambda once available |
| JWT signing keys                  | 90 days           | Issue new key, both keys valid for 24h overlap, expire old key |
| R2 access keys                    | 180 days          | Issue new key, deploy, revoke old                       |
| Twilio / Stripe / Plaid / Melio   | Vendor policy     | Per vendor                                              |
| Session secret                    | Annually          | Issue new, deploy, all sessions invalidated             |

Rotation events are logged to `audit_log` with `action = 'SECRET_ROTATED'`.

---

## 6. `.env.example` contents

The committed template. Keep it up to date with the inventory above.

```env
# ==== shared ====
NODE_ENV=local
LOG_LEVEL=debug
BUILD_SHA=local

# ==== api ====
PORT=8080
DATABASE_URL=postgres://tcharts:tcharts@localhost:5432/tcharts_dev
REDIS_URL=redis://localhost:6379/0

# Generate dev keys with:
#   openssl genpkey -algorithm RSA -out jwt-private.pem -pkeyopt rsa_keygen_bits:2048
#   openssl rsa -in jwt-private.pem -pubout -out jwt-public.pem
# Then paste base64 versions here.
JWT_PRIVATE_KEY=
JWT_PUBLIC_KEY=
JWT_ACCESS_TTL_SECONDS=900
REFRESH_TOKEN_TTL_DAYS=30
BCRYPT_COST=12

# Cloudflare R2 — dev account
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=tcharts-dev

# Twilio Verify (test credentials work for dev — see Twilio docs)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_VERIFY_SERVICE_SID=

# SES (dev: use MailHog instead — set SES_FROM_ADDRESS, leave region empty)
SES_REGION=us-east-1
SES_FROM_ADDRESS=noreply@localhost

# CORS
ALLOWED_ORIGINS=http://localhost:3000

# Sentry
SENTRY_DSN=

# ==== worker ====
WORKER_CONCURRENCY_DEFAULT=5
WORKER_AUDIT_FLUSH_INTERVAL_MS=5000

# ==== web ====
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_SENTRY_DSN=
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://eu.posthog.com
INTERNAL_API_URL=http://localhost:8080
COOKIE_DOMAIN=localhost
SESSION_SECRET=change-me-in-production-this-is-only-for-local
```

---

## 7. Loading order in code

### NestJS apps (api, worker)

```ts
// apps/api/src/main.ts
import 'dotenv-flow/config'; // loads .env, .env.local, .env.<NODE_ENV>
import { env } from './config/env'; // parses + validates with Zod
// ...
await NestFactory.create(AppModule, /* ... */);
```

`dotenv-flow` does **nothing** if the variables are already in `process.env` (which is the case in ECS). On local, it loads from `.env*` files.

### Next.js (web)

Next.js loads `.env`, `.env.local`, `.env.development`, `.env.production` automatically. The Zod validation runs at app boot in `apps/web/src/lib/env.ts`. The `NEXT_PUBLIC_*` values are baked at build time.

---

## 8. Configuration vs feature flags

Configuration values that vary per environment (DB URL, R2 bucket, allowed origins) live in env vars.

Boolean toggles that may need to be flipped at runtime per tenant (kill switches, beta gates) live in the `feature_flag` table and are read via `FeatureFlagService.isEnabled(tchartsAccountId, feature)`. See `MODULE_MAP.md` for the `shared/feature-flag` module.

The dividing line: **if the value differs per tenant, it's a feature flag. If it differs only per environment, it's env config.**

---

## 9. Local development quickstart

```bash
# 1. Clone and install
git clone <repo>
cd tcharts
pnpm install

# 2. Seed env
cp .env.example .env
# (most values work as-is for local)

# 3. Bring up Postgres + Redis + MailHog
docker compose -f infra/docker/docker-compose.local.yml up -d

# 4. Run migrations + seed
pnpm db:migrate
pnpm db:seed

# 5. Generate types from OpenAPI
pnpm contracts:generate

# 6. Run everything
pnpm dev
# - apps/api on :8080
# - apps/web on :3000
# - apps/worker (no port)
# - MailHog UI on :8025
```

If `pnpm install` fails with `EBUSY` / `EPERM` on Windows, see `docs/runbooks/ONEDRIVE_SETUP.md`.
