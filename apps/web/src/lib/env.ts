/**
 * apps/web env validation.
 *
 * Two separate parsings:
 *  - `clientEnv` — only NEXT_PUBLIC_* values. Safe to bundle.
 *  - `serverEnv` — server-only values (internal API URL, session secret, etc.).
 *                  Accessed only from server components and route handlers.
 *
 * Mixing them up will fail at build time because Next refuses to bundle
 * non-NEXT_PUBLIC_* variables into the client.
 */

import { z } from 'zod';

const ClientEnvSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url().default('http://localhost:8080'),
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional().default(''),
  NEXT_PUBLIC_POSTHOG_KEY: z.string().optional().default(''),
  NEXT_PUBLIC_POSTHOG_HOST: z.string().url().default('https://eu.posthog.com'),
});

const ServerEnvSchema = z.object({
  NODE_ENV: z.enum(['local', 'dev', 'staging', 'production']).default('local'),
  INTERNAL_API_URL: z.string().url().default('http://localhost:8080'),
  COOKIE_DOMAIN: z.string().default('localhost'),
  SESSION_SECRET: z.string().min(16).default('change-me-only-for-local-do-not-use-in-prod'),
});

export const clientEnv = ClientEnvSchema.parse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
  NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
  NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
});

export const serverEnv = (() => {
  // Only parse server-only env when we're actually on the server.
  if (typeof window !== 'undefined') {
    return null as never;
  }
  const parsed = ServerEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error('[web] Invalid server env:', parsed.error.flatten().fieldErrors);
    process.exit(1);
  }
  return parsed.data;
})();
