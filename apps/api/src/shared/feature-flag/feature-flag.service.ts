import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

/**
 * Feature flags — per-tenant kill switches and beta gates.
 *
 * Sprint 0 — stub that reads from the `feature_flag` table without caching.
 * Sprint 4+ — adds a 60s Redis cache and an in-process subscriber for changes.
 */

interface FeatureFlagRow {
  tchartsAccountId: string | null;
  feature: string;
  enabled: boolean;
}

@Injectable()
export class FeatureFlagService {
  constructor(private readonly prisma: PrismaService) {}

  async isEnabled(tchartsAccountId: string | null, feature: string): Promise<boolean> {
    // Tenant-specific value wins if present; otherwise fall back to the global default.
    const rows = (await this.prisma.featureFlag.findMany({
      where: {
        feature,
        OR: tchartsAccountId
          ? [{ tchartsAccountId }, { tchartsAccountId: null }]
          : [{ tchartsAccountId: null }],
      },
    })) as FeatureFlagRow[];

    if (rows.length === 0) return false;

    const tenantRow = rows.find((r: FeatureFlagRow) => r.tchartsAccountId === tchartsAccountId);
    if (tenantRow) return tenantRow.enabled;

    const globalRow = rows.find((r: FeatureFlagRow) => r.tchartsAccountId === null);
    return globalRow?.enabled ?? false;
  }
}
