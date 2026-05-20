# `apps/api` — Tcharts NestJS HTTP API

Production deployable: `tcharts-api` ECS service.

## Stack
- NestJS 10 + Fastify adapter
- Prisma (via `@tcharts/db`)
- Pino logging (`nestjs-pino`)
- Sentry (graceful no-op if `SENTRY_DSN` is empty)
- Helmet + CORS + cookies

## Running locally
```bash
# from the repo root
pnpm install
docker compose -f infra/docker/docker-compose.local.yml up -d
pnpm db:migrate
pnpm db:seed
pnpm --filter @tcharts/api dev
```

Then `curl http://localhost:8080/health` should return 200.

## Sprint 0 surface
- `GET /health` → 200 always (liveness)
- `GET /ready` → 200 if Postgres + Redis reachable, 503 otherwise

## Module map
See [`docs/MODULE_MAP.md`](../../docs/MODULE_MAP.md) for the full inventory. Sprint 0 wires only the shared modules; domain modules ship in their sprints.

## Conventions
See [`docs/API_CONVENTIONS.md`](../../docs/API_CONVENTIONS.md). Every new endpoint must:
- Have an `operationId` in `packages/contracts/src/openapi.yaml`.
- Use the `@RequireCompanyContext()` and `@RequirePermission(...)` decorators (Sprint 3+).
- Validate input via Zod schemas from `@tcharts/contracts`.
- Return the standard success or error envelope.
