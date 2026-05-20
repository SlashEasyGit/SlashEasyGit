/**
 * apps/worker — NestJS standalone (no HTTP) BullMQ consumer host.
 *
 * Sprint 0: boots, connects to Postgres + Redis, registers no real jobs yet.
 * The presence of the process is what we test; queue handlers ship in S4+.
 */

import 'reflect-metadata';

// Load .env from the repo root (two levels up from this app's cwd).
// dotenv-flow's default is cwd, which would be apps/worker in our monorepo.
import dotenvFlow from 'dotenv-flow';
import path from 'node:path';
dotenvFlow.config({ path: path.resolve(process.cwd(), '..', '..'), silent: true });

import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';

import { AppModule } from './app.module';
import { initSentry } from './sentry.init';

async function bootstrap(): Promise<void> {
  initSentry();
  const app = await NestFactory.createApplicationContext(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));
  app.enableShutdownHooks();
  // eslint-disable-next-line no-console
  console.warn('[worker] Boot complete; awaiting jobs');
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[worker] Fatal during bootstrap', err);
  process.exit(1);
});
