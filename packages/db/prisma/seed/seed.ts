/**
 * Idempotent seed script.
 * Run via `pnpm db:seed`. Safe to re-run.
 *
 * Seeds:
 *  - Role table (4 fixed roles)
 *  - Permission table (all permission keys from @tcharts/domain)
 *  - RolePermission default matrix
 *  - FeatureFlag defaults (none in S0)
 *
 * Sprint 1+ seeds (users, companies, demo data) will be added in their sprints.
 */

import { PERMISSIONS, ROLE_PERMISSION_DEFAULTS, ROLES } from '@tcharts/domain';

import { getStandalonePrismaClient } from '../../src/client';
import { seedRolePermissionDefaults } from './role-permission-defaults';

const ROLE_DEFINITIONS: Record<(typeof ROLES)[number], { name: string; scope: 'account' | 'company' }> = {
  PrimaryAdmin: { name: 'Primary Admin', scope: 'account' },
  CompanyAdmin: { name: 'Company Admin', scope: 'company' },
  Accountant: { name: 'Accountant', scope: 'company' },
  ExternalUser: { name: 'External User', scope: 'company' },
};

async function main(): Promise<void> {
  const prisma = getStandalonePrismaClient();

  console.warn('[seed] Seeding roles…');
  for (const key of ROLES) {
    const def = ROLE_DEFINITIONS[key];
    await prisma.role.upsert({
      where: { key },
      create: { key, name: def.name, scope: def.scope },
      update: { name: def.name, scope: def.scope },
    });
  }

  console.warn('[seed] Seeding permissions…');
  for (const key of PERMISSIONS) {
    const [module, ...rest] = key.split('.');
    const task = rest.join('.');
    await prisma.permission.upsert({
      where: { key },
      create: { key, module: module ?? '', task },
      update: { module: module ?? '', task },
    });
  }

  console.warn('[seed] Seeding role-permission defaults…');
  await seedRolePermissionDefaults(prisma, ROLE_PERMISSION_DEFAULTS);

  console.warn('[seed] Done.');
}

main()
  .catch((err) => {
    console.error('[seed] Failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await getStandalonePrismaClient().$disconnect();
  });
