# `apps/worker` — Tcharts BullMQ background worker

Production deployable: `tcharts-worker` ECS service.

## Purpose

Runs background jobs that don't belong in the request path:
- Recurring journal entries (S4)
- Bank sync (S14)
- Email send via SES (S15)
- Audit log batched flush (S4)
- Month-end close pre-checks (S4)
- Idempotency cache cleanup (S4)

Sprint 0 scope: boots, connects to Redis + Postgres, registers no real jobs.
Real queues + processors are added in their sprints.

## Running locally

```bash
pnpm --filter @tcharts/worker dev
```

## Why a separate process

A slow job (large bank sync, audit flush) must not starve API request threads.
Separate ECS service = separate scaling, separate failure domain.
