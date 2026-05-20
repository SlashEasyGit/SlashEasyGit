# =============================================================================
# tcharts-worker  Dockerfile (multi-stage)
# =============================================================================

FROM node:20-alpine AS deps
RUN corepack enable && corepack prepare pnpm@9.12.3 --activate
WORKDIR /repo
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml turbo.json tsconfig.base.json ./
COPY packages/config/package.json   packages/config/
COPY packages/domain/package.json   packages/domain/
COPY packages/utils/package.json    packages/utils/
COPY packages/contracts/package.json packages/contracts/
COPY packages/db/package.json       packages/db/
COPY apps/worker/package.json       apps/worker/
COPY apps/api/package.json          apps/api/
COPY apps/web/package.json          apps/web/
COPY packages/ui/package.json       packages/ui/
RUN pnpm install --frozen-lockfile

FROM node:20-alpine AS build
RUN corepack enable && corepack prepare pnpm@9.12.3 --activate
WORKDIR /repo
COPY --from=deps /repo /repo
COPY . .
ARG BUILD_SHA=local
ENV BUILD_SHA=${BUILD_SHA}
RUN pnpm --filter @tcharts/db prisma:generate
RUN pnpm --filter @tcharts/worker... build

FROM node:20-alpine AS runtime
RUN corepack enable && corepack prepare pnpm@9.12.3 --activate
WORKDIR /app
RUN addgroup -S tcharts && adduser -S tcharts -G tcharts
COPY --from=build /repo/apps/worker/dist           /app/apps/worker/dist
COPY --from=build /repo/apps/worker/package.json   /app/apps/worker/package.json
COPY --from=build /repo/packages                   /app/packages
COPY --from=build /repo/node_modules               /app/node_modules
COPY --from=build /repo/package.json               /app/package.json
USER tcharts
ENV NODE_ENV=production
CMD ["node", "apps/worker/dist/main.js"]
