/**
 * apps/api env loading + validation.
 *
 * `dotenv-flow/config` is imported in main.ts before this file is loaded,
 * which populates process.env from .env files in local dev.
 *
 * In production, env comes from the ECS task definition (Secrets Manager).
 */

import { z } from 'zod';

const csv = (s: string): string[] => s.split(',').map((v) => v.trim()).filter(Boolean);

const EnvSchema = z.object({
  NODE_ENV: z.enum(['local', 'dev', 'staging', 'production']).default('local'),
  PORT: z.coerce.number().int().positive().default(8080),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  BUILD_SHA: z.string().default('local'),

  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),

  // Auth — required from Sprint 1 onwards; optional in Sprint 0 to allow boot.
  JWT_PRIVATE_KEY: z.string().optional(),
  JWT_PUBLIC_KEY: z.string().optional(),
  JWT_ACCESS_TTL_SECONDS: z.coerce.number().int().positive().default(900),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(30),
  BCRYPT_COST: z.coerce.number().int().min(10).max(15).default(12),

  // R2 — required from Sprint 7
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET: z.string().default('tcharts-dev'),

  // Twilio — required from Sprint 1
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_VERIFY_SERVICE_SID: z.string().optional(),

  // SES — required from Sprint 1
  SES_REGION: z.string().default('us-east-1'),
  // Local dev allows synthetic domains like "noreply@localhost.local" — we don't enforce
  // strict RFC 5321 because MailHog accepts anything. Production env should set a real address.
  SES_FROM_ADDRESS: z.string().min(3).default('noreply@localhost.local'),

  // CORS
  ALLOWED_ORIGINS: z
    .string()
    .default('http://localhost:3000')
    .transform(csv),

  // Sentry — empty string means "stub" (graceful no-op).
  SENTRY_DSN: z.string().optional().default(''),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('[api] Invalid environment:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export type Env = z.infer<typeof EnvSchema>;
