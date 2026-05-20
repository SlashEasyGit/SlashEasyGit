import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['local', 'dev', 'staging', 'production']).default('local'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  BUILD_SHA: z.string().default('local'),

  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),

  WORKER_CONCURRENCY_DEFAULT: z.coerce.number().int().positive().default(5),
  WORKER_AUDIT_FLUSH_INTERVAL_MS: z.coerce.number().int().positive().default(5000),

  SENTRY_DSN: z.string().optional().default(''),
});

const parsed = EnvSchema.safeParse(process.env);
if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('[worker] Invalid environment:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export type Env = z.infer<typeof EnvSchema>;
