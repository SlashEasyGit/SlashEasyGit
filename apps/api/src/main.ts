/**
 * apps/api — NestJS HTTP entry point.
 *
 * Order of responsibilities at boot:
 *   1. Load .env (local) — production reads env from ECS task definition.
 *   2. Validate env (Zod) — fail fast if anything required is missing.
 *   3. Initialize Sentry (graceful no-op if SENTRY_DSN is empty).
 *   4. Boot Nest with Fastify adapter.
 *   5. Wire global middleware (helmet, CORS, cookies, Pino).
 *   6. Listen.
 */

import 'reflect-metadata';

// Load .env from the repo root (two levels up from this app's cwd).
// dotenv-flow's default is cwd, which would be apps/api in our monorepo.
import dotenvFlow from 'dotenv-flow';
import path from 'node:path';
dotenvFlow.config({ path: path.resolve(process.cwd(), '..', '..'), silent: true });

import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  type NestFastifyApplication,
} from '@nestjs/platform-fastify';
import fastifyCookie from '@fastify/cookie';
import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import { Logger } from 'nestjs-pino';

import { AppModule } from './app.module';
import { env } from './config/env';
import { initSentry } from './shared/sentry/sentry.init';

async function bootstrap(): Promise<void> {
  initSentry();

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: false, // Pino is wired via nestjs-pino
      trustProxy: true,
      bodyLimit: 1_048_576, // 1 MB default; multipart routes opt out
    }),
    { bufferLogs: true },
  );

  app.useLogger(app.get(Logger));

  await app.register(fastifyHelmet, {
    contentSecurityPolicy: false, // CSP is set on web responses, not API
  });
  await app.register(fastifyCors, {
    origin: env.ALLOWED_ORIGINS,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Authorization',
      'Content-Type',
      'Idempotency-Key',
      'X-Request-ID',
      'X-Tcharts-Company',
      'X-Requested-With',
    ],
  });
  await app.register(fastifyCookie);

  app.enableShutdownHooks();

  await app.listen({ port: env.PORT, host: '0.0.0.0' });
  // eslint-disable-next-line no-console
  console.warn(`[api] Listening on http://0.0.0.0:${env.PORT}`);
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[api] Fatal during bootstrap', err);
  process.exit(1);
});
