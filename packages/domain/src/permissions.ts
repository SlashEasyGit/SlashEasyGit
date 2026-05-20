/**
 * Tcharts permission inventory.
 * The single source of truth for `(module, task)` permission keys.
 *
 * Seed script `packages/db/prisma/seed/role-permission-defaults.ts` reads this enum
 * to populate the `permission` table and the role-default matrix in `role_permission`.
 *
 * Per System Spec §3.6 and docs/PERMISSION_MODEL.md.
 */

import type { Role } from './role';

export const PERMISSIONS = [
  // Account-level
  'account.manage',
  'company.manage',
  'company.settings.edit',
  'permission.override',
  'user.invite',
  'user.role.change',

  // COA
  'coa.view',
  'coa.edit',

  // Period Control
  'period-control.view',
  'period-control.manage',

  // Sales Tax
  'sales-tax.view',
  'sales-tax.edit',

  // Revenue
  'revenue.view',
  'revenue.enter_transactions',
  'revenue.approve_transactions',
  'revenue.view_reports',

  // Expense
  'expense.view',
  'expense.enter_transactions',
  'expense.approve_transactions',
  'expense.view_reports',

  // General Ledger
  'gl.view',
  'gl.enter_journal',
  'gl.view_reports',

  // Banking
  'banking.view',
  'banking.reconcile',
  'banking.pay_bills',

  // Accounting Hub
  'hub.documents',
  'hub.tasks',
  'hub.calendar',
  'hub.chat',
  'hub.notes',

  // Dashboard
  'dashboard.view',
  'dashboard.view_bank_balance',

  // Audit Log
  'audit-log.view',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

/**
 * The role-default matrix per System Spec §3.6.
 * Each cell: true (granted), false (not granted), null (not applicable for this role).
 *
 * "Not applicable" maps to "module entirely hidden from this role" — see role.ts.
 * The permission engine returns `false` for not-applicable, the UI hides the module.
 */
export const ROLE_PERMISSION_DEFAULTS: Record<Role, Partial<Record<Permission, boolean>>> = {
  PrimaryAdmin: {
    // Primary Admin bypasses resolution entirely; this map is informational.
    // Every permission resolves to true for PA in their own Tcharts Account.
    'account.manage': true,
    'company.manage': true,
    'company.settings.edit': true,
    'permission.override': true,
    'user.invite': true,
    'user.role.change': true,
    'coa.view': true,
    'coa.edit': true,
    'period-control.view': true,
    'period-control.manage': true,
    'sales-tax.view': true,
    'sales-tax.edit': true,
    'revenue.view': true,
    'revenue.enter_transactions': true,
    'revenue.approve_transactions': true,
    'revenue.view_reports': true,
    'expense.view': true,
    'expense.enter_transactions': true,
    'expense.approve_transactions': true,
    'expense.view_reports': true,
    'gl.view': true,
    'gl.enter_journal': true,
    'gl.view_reports': true,
    'banking.view': true,
    'banking.reconcile': true,
    'banking.pay_bills': true,
    'hub.documents': true,
    'hub.tasks': true,
    'hub.calendar': true,
    'hub.chat': true,
    'hub.notes': true,
    'dashboard.view': true,
    'dashboard.view_bank_balance': true,
    'audit-log.view': true,
  },
  CompanyAdmin: {
    'account.manage': false,
    'company.manage': false,
    'company.settings.edit': true,
    'permission.override': true,
    'user.invite': true,
    'user.role.change': true,
    'coa.view': true,
    'coa.edit': true,
    'period-control.view': true,
    'period-control.manage': true,
    'sales-tax.view': true,
    'sales-tax.edit': true,
    'revenue.view': true,
    'revenue.enter_transactions': true,
    'revenue.approve_transactions': true,
    'revenue.view_reports': true,
    'expense.view': true,
    'expense.enter_transactions': true,
    'expense.approve_transactions': true,
    'expense.view_reports': true,
    'gl.view': true,
    'gl.enter_journal': true,
    'gl.view_reports': true,
    'banking.view': true,
    'banking.reconcile': true,
    'banking.pay_bills': true,
    'hub.documents': true,
    'hub.tasks': true,
    'hub.calendar': true,
    'hub.chat': true,
    'hub.notes': true,
    'dashboard.view': true,
    'dashboard.view_bank_balance': true,
    'audit-log.view': false,
  },
  Accountant: {
    'account.manage': false,
    'company.manage': false,
    'company.settings.edit': false,
    'permission.override': false,
    'user.invite': false,
    'user.role.change': false,
    'coa.view': true,
    'coa.edit': true,
    'period-control.view': false,
    'period-control.manage': false,
    'sales-tax.view': true,
    'sales-tax.edit': false,
    'revenue.view': true,
    'revenue.enter_transactions': true,
    'revenue.approve_transactions': true,
    'revenue.view_reports': true,
    'expense.view': true,
    'expense.enter_transactions': true,
    'expense.approve_transactions': true,
    'expense.view_reports': true,
    'gl.view': true,
    'gl.enter_journal': true,
    'gl.view_reports': true,
    'banking.view': true,
    'banking.reconcile': true,
    'banking.pay_bills': true,
    'hub.documents': true,
    'hub.tasks': true,
    'hub.calendar': true,
    'hub.chat': true,
    'hub.notes': true,
    'dashboard.view': true,
    'dashboard.view_bank_balance': true,
    'audit-log.view': false,
  },
  ExternalUser: {
    'account.manage': false,
    'company.manage': false,
    'company.settings.edit': false,
    'permission.override': false,
    'user.invite': false,
    'user.role.change': false,
    'coa.view': true,
    'coa.edit': false,
    'period-control.view': false,
    'period-control.manage': false,
    'sales-tax.view': false,
    'sales-tax.edit': false,
    'revenue.view': true,
    'revenue.enter_transactions': false,
    'revenue.approve_transactions': true,
    'revenue.view_reports': true,
    'expense.view': true,
    'expense.enter_transactions': false,
    'expense.approve_transactions': true,
    'expense.view_reports': true,
    'gl.view': true,
    'gl.enter_journal': false,
    'gl.view_reports': true,
    // banking and hub are entirely hidden, not just denied
    'banking.view': false,
    'banking.reconcile': false,
    'banking.pay_bills': false,
    'hub.documents': false,
    'hub.tasks': false,
    'hub.calendar': false,
    'hub.chat': false,
    'hub.notes': false,
    'dashboard.view': true,
    'dashboard.view_bank_balance': false,
    'audit-log.view': false,
  },
};

export function getRoleDefault(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSION_DEFAULTS[role][permission] ?? false;
}
