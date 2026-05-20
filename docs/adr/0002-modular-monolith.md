# ADR-0002 — Modular monolith, not microservices

- **Status:** Accepted
- **Date:** 2026-05-12
- **Confirms:** DOC1 §4.1, §4.2

---

## Context

We must choose between three architecture styles for the backend: monolith (no module boundaries), modular monolith (strict boundaries, one process), or microservices (separate processes per domain).

## Decision

**Modular monolith.** Two Node processes:

- `apps/api` — all HTTP and WebSocket request handling, all business logic, all DB access.
- `apps/worker` — BullMQ consumers for background jobs (recurring journal entries, bank sync, email send, audit log flush, month-end pre-checks).

Both processes share the same NestJS module structure under `apps/api/src/modules/` (the worker imports the relevant module's services). Inside both processes, modules are isolated by **import boundaries**:

1. A module's controllers/services may import only from: its own module, `shared/*`, or other modules' public services (re-exported from `modules/<name>/index.ts`).
2. A module **never** imports another module's repositories or raw DB queries.
3. Cross-module data goes through public service methods or in-process domain events (`EventEmitter2`).
4. ESLint rule `import/no-restricted-paths` enforces all three rules at PR time.

One PostgreSQL database. One Prisma schema. One transaction per posting.

## Rationale

### Why not a flat monolith

A flat monolith without enforced module boundaries becomes spaghetti within months. Specifically for Tcharts:

- The Period Control gate must be invoked from every posting path. Without strict boundaries, modules forget to invoke it or invoke it inconsistently.
- The Audit Log writer must be invoked from every mutation. Same risk.
- The double-entry invariant requires that *only* `JournalPostingService` writes to `journal_entry`. Without import rules, any module could write a one-sided entry directly.

The cost of enforcing module boundaries is a single ESLint rule and the discipline to write public service barrels. The cost of not enforcing them is a periodic spaghetti-extraction effort and silent accounting bugs.

### Why not microservices

Microservices were rejected for one reason that overrides all others: **journal posting is one transaction**.

When a Bill is posted, the same DB transaction must:

- Insert the `bill` row.
- Insert balanced `journal_entry` + `journal_entry_line` rows.
- Update sub-ledger control accounts implicitly through the journal lines.
- Insert an `audit_log` row.
- Insert an `approval_request` row if approval is enabled.

Splitting these across services would require distributed transactions (Saga pattern, eventual consistency, compensating actions). For accounting, eventual consistency is unacceptable — a Bill that exists without its journal entry, even for 500ms, is a moment where reports are wrong and audit log is incomplete.

The accountant-trust invariant beats the service-decoupling benefit.

Other reasons:

- **Ops cost.** A solo founder-engineer at launch + a small team at GA. Running N services with N pipelines, N deploys, N monitoring stacks, is unaffordable.
- **Cross-service permission checks** would need a separate identity service or pushed-down JWT claims. Either is more complex than one auth module in one process.
- **Local dev environment.** One `docker compose up` brings everything up. Microservices would require some kind of service mesh / hot-reload coordination locally.

### When we'd revisit

Per DOC1 §4.2, revisit at:

- 50+ engineers (Conway's law starts to bite),
- a domain with materially different scaling characteristics (e.g., a `reports` workload that needs read-replica fan-out independently of API tasks), or
- a regulatory requirement that demands physical data isolation per tenant.

None of these apply in v1.

## Consequences

### What we get

- One transaction model. One auth model. One audit model. One period-control gate. One posting path.
- New engineers onboard module-by-module. The repo is navigable.
- Local dev is `pnpm dev` from the monorepo root.
- Deploy is two ECS services (api, worker) plus the web service from ADR-0001.
- Refactors that move code between modules are pure import-path changes — no inter-service contract negotiation.

### What we pay

- Discipline. Module boundaries must be policed in code review. Any cross-module import of a repository is a P1 review finding.
- Build times grow with the codebase. Mitigated by Turborepo's incremental build + remote cache.
- Process memory grows with the codebase. Mitigated by Fargate task right-sizing per service.

## How to add a new module

1. Create `apps/api/src/modules/<name>/`.
2. Add `index.ts` exporting only the public services + types.
3. Add `module.ts` (NestJS), `controller.ts`, `service.ts`, `repository.ts`, `dto.ts`.
4. Add `README.md` describing: purpose, public surface, dependencies, key invariants, owned DB tables.
5. Add the module to the import path allowlist in `eslint.config.js`.
6. Add module-specific tests under the module folder.

## References

- DOC1 §4.1, §4.2, §4.3 (architecture strategy)
- DOC1 §4.5 (module boundary rules)
- DOC1 §2.7 (transaction lifecycle)
- DOC1 §13.1 (accounting risk: silent double-entry violations)
