/**
 * Seeds the role_permission default matrix from @tcharts/domain.
 * Idempotent (upsert per (role, permission)).
 */

import type { PrismaClient } from '@prisma/client';
import type { Permission, Role } from '@tcharts/domain';

export async function seedRolePermissionDefaults(
  prisma: PrismaClient,
  defaults: Record<Role, Partial<Record<Permission, boolean>>>,
): Promise<void> {
  const roles = await prisma.role.findMany();
  const permissions = await prisma.permission.findMany();
  const roleByKey = new Map(roles.map((r) => [r.key, r] as const));
  const permByKey = new Map(permissions.map((p) => [p.key, p] as const));

  for (const [roleKey, map] of Object.entries(defaults)) {
    const role = roleByKey.get(roleKey);
    if (!role) {
      console.warn(`[seed] Skipping unknown role: ${roleKey}`);
      continue;
    }
    for (const [permKey, granted] of Object.entries(map)) {
      const perm = permByKey.get(permKey);
      if (!perm) {
        console.warn(`[seed] Skipping unknown permission: ${permKey}`);
        continue;
      }
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: { roleId: role.id, permissionId: perm.id },
        },
        create: { roleId: role.id, permissionId: perm.id, granted: granted ?? false },
        update: { granted: granted ?? false },
      });
    }
  }
}
