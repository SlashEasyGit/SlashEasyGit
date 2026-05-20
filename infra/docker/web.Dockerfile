# =============================================================================
# tcharts-web  Dockerfile  (Next.js 15 standalone)
# Per ADR-0001 the web tier is deployed as a Node service, not static.
# =============================================================================

FROM node:20-alpine AS deps
RUN corepack enable && corepack prepare pnpm@9.12.3 --activate
WORKDIR /repo
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml turbo.json tsconfig.base.json ./
COPY packages/config/package.json   packages/config/
COPY packages/domain/package.json   packages/domain/
COPY packages/utils/package.json    packages/utils/
COPY packages/contracts/package.json packages/contracts/
COPY packages/ui/package.json       packages/ui/
COPY packages/db/package.json       packages/db/
COPY apps/web/package.json          apps/web/
COPY apps/api/package.json          apps/api/
COPY apps/worker/package.json       apps/worker/
RUN pnpm install --frozen-lockfile

FROM node:20-alpine AS build
RUN corepack enable && corepack prepare pnpm@9.12.3 --activate
WORKDIR /repo
COPY --from=deps /repo /repo
COPY . .
ARG BUILD_SHA=local
ENV BUILD_SHA=${BUILD_SHA}
ENV NEXT_TELEMETRY_DISABLED=1

# Build args for NEXT_PUBLIC_* (baked into the client bundle)
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SENTRY_DSN
ARG NEXT_PUBLIC_POSTHOG_KEY
ARG NEXT_PUBLIC_POSTHOG_HOST
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_SENTRY_DSN=${NEXT_PUBLIC_SENTRY_DSN}
ENV NEXT_PUBLIC_POSTHOG_KEY=${NEXT_PUBLIC_POSTHOG_KEY}
ENV NEXT_PUBLIC_POSTHOG_HOST=${NEXT_PUBLIC_POSTHOG_HOST}

RUN pnpm --filter @tcharts/web... build

FROM node:20-alpine AS runtime
WORKDIR /app
RUN addgroup -S tcharts && adduser -S tcharts -G tcharts

# Next.js standalone output (configured via output: 'standalone' in next.config when enabled)
# For Sprint 0 we ship the full .next folder + node_modules. Standalone optimisation comes later.
COPY --from=build /repo/apps/web/.next        /app/apps/web/.next
COPY --from=build /repo/apps/web/public       /app/apps/web/public
COPY --from=build /repo/apps/web/package.json /app/apps/web/package.json
COPY --from=build /repo/apps/web/next.config.mjs /app/apps/web/next.config.mjs
COPY --from=build /repo/packages              /app/packages
COPY --from=build /repo/node_modules          /app/node_modules
COPY --from=build /repo/package.json          /app/package.json

USER tcharts
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
EXPOSE 3000

CMD ["node", "apps/web/node_modules/next/dist/bin/next", "start", "apps/web", "--port", "3000"]
