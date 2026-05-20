/**
 * RLS context helper.
 *
 * Per ADR-0003: every tenant-scoped query must run inside a transaction where
 * the session variable `app.current_company_id` (and/or `app.current_tcharts_account_id`)
 * is set. If unset, RLS policies hide every row — this is the safety net.
 *
 * Typical usage in apps/api (via PrismaService):
 *
 *   await this.prisma.$transaction(async (tx) => {
 *     await setRlsContext(tx, ctx);
 *     // ... module work happens here, RLS is active ...
 *   }, { isolationLevel: 'Serializable' });
 */

import type { PrismaClient, Prisma } from '@prisma/client';

export interface RlsContext {
  readonly tchartsAccountId: string;
  readonly companyId?: string;
}

export type AnyTransactionClient = PrismaClient | Prisma.TransactionClient;

/**
 * Sets the RLS session variables for the duration of the current transaction.
 * Throws if not called within a transaction (SET LOCAL outside a tx is a no-op).
 *
 * @param tx the transaction client (from `prisma.$transaction(async (tx) => …)`)
 * @param ctx the request's tenant context
 */
export async function setRlsContext(tx: AnyTransactionClient, ctx: RlsContext): Promise<void> {
  // Validate UUIDs minimally to prevent SQL injection via $executeRawUnsafe.
  // Prisma's parameterised $executeRaw does NOT work with SET commands, so we
  // accept the constrained format guard here.
  assertUuid(ctx.tchartsAccountId, 'tchartsAccountId');
  if (ctx.companyId !== undefined) {
    assertUuid(ctx.companyId, 'companyId');
  }

  await tx.$executeRawUnsafe(
    `SET LOCAL app.current_tcharts_account_id = '${ctx.tchartsAccountId}'`,
  );
  if (ctx.companyId) {
    await tx.$executeRawUnsafe(`SET LOCAL app.current_company_id = '${ctx.companyId}'`);
  }
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function assertUuid(value: string, field: string): void {
  if (typeof value !== 'string' || !UUID_RE.test(value)) {
    throw new Error(`setRlsContext: ${field} is not a valid UUID`);
  }
}
