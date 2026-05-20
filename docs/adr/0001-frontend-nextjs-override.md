# ADR-0001 — Override DOC1 frontend choice: use Next.js 15 App Router

- **Status:** Accepted
- **Date:** 2026-05-12
- **Deciders:** Product owner (Mehul Acharya), Lead Architect
- **Supersedes:** DOC1 §3.1 (React 18 + Vite + TanStack Router)

---

## Context

`DOC1_Development_Plan.pdf` §3.1 explicitly chose **React 18 + Vite + TanStack Router** for the frontend, with rationale:

> Tcharts is an authenticated, data-heavy SPA. SSR doesn't earn its complexity here (no public marketing pages in the app, no SEO surface, no streaming HTML benefit for a private workspace). Vite gives near-instant HMR which matters on a codebase that will be 80k+ lines of TypeScript.

At the same time, the top-level engineering brief for this engagement specifies **Next.js** in the required tech stack. DOC1 itself states: *"module specifications win over this plan; this plan never contradicts confirmed spec rules"* — implying DOC1 binds the implementation against the module specs, but the engineering brief (which sits *above* DOC1 in the authority hierarchy) can override DOC1's stack-level choices.

The product owner has explicitly chosen Next.js, overriding DOC1 §3.1.

This is the **largest deviation from DOC1** in the project. We capture it formally so the rationale, trade-offs, and downstream architectural changes are traceable.

## Decision

The web tier is built on **Next.js 15 with the App Router**, deployed as a Node.js service on AWS ECS Fargate.

- **Framework:** Next.js 15.x, App Router, TypeScript strict.
- **Rendering strategy:** RSC for auth-gated layout, route guards, and any data-heavy read-only view (Dashboard initial paint, Reports). Client Components for all interactive forms, tables with filters/sorting, and any feature that uses TanStack Query, Socket.IO, or Zustand.
- **Routing:** Next.js App Router file-based routes. We adapt DOC1's per-route auth/permission guards into App Router middleware + per-segment `layout.tsx` guards.
- **Data fetching:** TanStack Query for client components; native `fetch` with `next: { tags, revalidate }` for server components. The OpenAPI-generated TS client is the only entry point to the API from either side.
- **Deployment:** Multi-stage Docker image → ECR → ECS Fargate service `web`. Behind ALB + Cloudflare. Not statically exported.
- **Auth integration:** The Next.js server proxies the refresh-token cookie to the API. The access token never reaches the browser at rest — it lives in memory in client components and is refetched via a route handler that calls the API's `/auth/refresh`.

## Rationale

DOC1's reasons to reject Next.js, re-examined:

| DOC1 concern                              | Status today                                                                                                                          |
|-------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------|
| "SSR doesn't earn its complexity"         | Partially still true. We use SSR/RSC sparingly — only for layout and auth shell. App pages remain client-side. The complexity is contained. |
| "No public marketing surface, no SEO"     | Still true. Marketing site is separate. We accept that SSR is over-engineered for what we use it for; the offset is below.            |
| "Vite gives near-instant HMR"             | Next 15 + Turbopack HMR is comparable for our app size. Not a meaningful penalty.                                                     |
| "No streaming HTML benefit for private workspace" | True, but RSC also gives us a clean server boundary for auth checks and per-route data prefetch that would otherwise be loader code.   |

Reasons to choose Next.js anyway:

1. **Engineering brief mandate.** The product owner has chosen it for hiring/talent pool reasons (Next.js is the larger talent pool in 2026 than TanStack Router).
2. **Server boundary is useful for auth.** RSC + middleware gives us a natural pre-render auth gate that an SPA has to fake with a flash-of-unauthenticated-content workaround.
3. **Route handlers replace a thin BFF.** Things like cookie management, CSRF token issuance, and short-lived signed URL minting fit naturally in route handlers without standing up a separate BFF service.
4. **Future surface.** When (not if) we add a public marketing site, embedded widgets, or partner-facing read-only links, those benefit from Next's SSR. We don't need them in v1, but the option becomes free.

## Consequences

### Architectural changes from DOC1

1. **DOC1 §3.25 — Deployment:** CloudFront + S3 for the SPA bundle becomes **ALB + ECS Fargate service `web`** for Next.js. CloudFront optionally fronts Next's static asset routes (`/_next/static/`).
2. **DOC1 §3.24 — Three ECS services now, not two.** `web` + `api` + `worker`. Web service is small (smaller CPU, larger network, more replicas during peak).
3. **DOC1 §3.2 — Routing:** TanStack Router is **not** used. App Router replaces it. Route segment names map 1:1 to DOC1's intended URL structure.
4. **DOC1 §7 — Auth flow:** Refresh-token cookie continues to be HttpOnly + Secure + SameSite=Strict, but now the cookie's domain is the web app (`app.tcharts.app`), not the API. The Next.js server reads the cookie and forwards an internal call to the API for refresh. Access tokens are held in memory in the browser via a React context.
5. **DOC1 §3.12 — State management:** TanStack Query stays. Zustand stays. The "client state" vs "server state" boundary remains; we additionally now have "server-side render state" (props passed from server components) — those are read-only snapshots, never used as a source of truth for mutations.
6. **DOC1 §11.8 — Lazy loading:** Next.js handles route-level code splitting natively. Heavy components (rich text editor, FullCalendar, chart libs) wrapped in `next/dynamic` rather than `React.lazy`.
7. **DOC1 §3.21 — CI/CD:** The `web` build step changes from static asset upload to S3 → Docker build + push to ECR. CloudFront invalidation is replaced by ECS rolling deploy.

### Costs accepted

- **Ops surface +1.** A third ECS service to monitor, scale, and patch.
- **Cold start latency on first paint.** Next.js Node start is ~500ms vs near-zero for static assets. Mitigated by min 2 tasks always warm and CloudFront edge caching of static assets.
- **Bundle size baseline higher.** Next bundle baseline > Vite SPA baseline. Mitigated by aggressive `next/dynamic` and RSC offload of layout chunks.
- **Mental model split.** Engineers must keep "server component vs client component" boundaries straight. We codify this in the per-module README and ESLint (`'use client'` lint rules).

### Costs *not* accepted (and how we avoid them)

- **We do not use server actions for accounting mutations.** All financial mutations go through the typed API client to the NestJS API. Server actions stay out of the posting path. Rationale: the API is the single, audited, period-controlled, idempotent posting surface; bypassing it from server actions would create a second posting path we'd have to audit and harden separately.
- **We do not use Next's API routes as the API.** The NestJS API at `api.tcharts.app` is the only API. Next route handlers exist only for cookie handling, CSRF, and short-lived BFF utilities — never for business logic, never for DB access.

## Reversal cost

If we ever revert to Vite + TanStack Router, the work is:

- Replace App Router files with TanStack Router route tree (mechanical translation).
- Move route-segment data fetches from server components to TanStack Query loaders (mechanical).
- Replace `next/dynamic` with `React.lazy`.
- Replace ECS service with S3+CloudFront static bundle.
- Re-do CI deploy step.

Estimated effort if reverted at Sprint 16: 1–2 weeks. **The reversal is cheap because we keep business logic, API contract, auth model, and component implementations framework-agnostic** (no server actions in the posting path; no Next-specific imports in shared component code).

## References

- DOC1 §3.1 (original choice and rationale)
- DOC1 §3.24, §3.25, §10.1 (deployment topology — adapted by this ADR)
- DOC1 §7 (auth flow — adapted by this ADR)
- ADR-0002 (modular monolith — unaffected)
- ADR-0003 (RLS tenant isolation — unaffected; web service does not connect to Postgres)
