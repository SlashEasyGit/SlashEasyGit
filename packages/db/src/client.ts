/**
 * Prisma client provider.
 *
 * In `apps/api` and `apps/worker`, the actual NestJS-managed PrismaService
 * wraps this client and is responsible for setting `app.current_company_id`
 * via `SET LOCAL` at the start of every transaction (see extensions/rls-context.ts).
 *
 * Outside the request path (seed scripts, one-off CLI), this raw client is fine.
 */

import { PrismaClient } from '@prisma/client';

export { PrismaClient };

let _globalClient: PrismaClient | undefined;

/**
 * Singleton for non-request contexts (seed scripts, migrations).
 * Do NOT use this inside the NestJS request lifecycle — use the PrismaService.
 */
export function getStandalonePrismaClient(): PrismaClient {
  if (!_globalClient) {
    _globalClient = new PrismaClient({
      log: process.env.LOG_LEVEL === 'debug' ? ['query', 'warn', 'error'] : ['warn', 'error'],
    });
  }
  return _globalClient;
}
