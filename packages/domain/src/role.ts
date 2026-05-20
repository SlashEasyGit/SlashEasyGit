/**
 * Tcharts roles — the fixed set per System Spec §3.
 * No custom roles in v1.
 */

export const ROLES = ['PrimaryAdmin', 'CompanyAdmin', 'Accountant', 'ExternalUser'] as const;
export type Role = (typeof ROLES)[number];

/** Display labels (English) per Brand voice. */
export const ROLE_LABELS: Record<Role, string> = {
  PrimaryAdmin: 'Primary Admin',
  CompanyAdmin: 'Company Admin',
  Accountant: 'Accountant',
  ExternalUser: 'External User',
};

/** Account-level vs company-level scope. */
export type RoleScope = 'account' | 'company';

export const ROLE_SCOPE: Record<Role, RoleScope> = {
  PrimaryAdmin: 'account',
  CompanyAdmin: 'company',
  Accountant: 'company',
  ExternalUser: 'company',
};

export function isCompanyScopedRole(role: Role): boolean {
  return ROLE_SCOPE[role] === 'company';
}

/**
 * Modules that are completely hidden from certain roles (not just permission-gated).
 * See PERMISSION_MODEL.md §6.
 */
export const MODULES_HIDDEN_FROM_ROLE: Partial<Record<Role, readonly string[]>> = {
  ExternalUser: ['banking', 'accounting-hub', 'period-control', 'audit-log'] as const,
  Accountant: ['period-control', 'audit-log'] as const,
  CompanyAdmin: ['audit-log'] as const,
};

export function isModuleHiddenFromRole(role: Role, module: string): boolean {
  const hidden = MODULES_HIDDEN_FROM_ROLE[role];
  return hidden ? hidden.includes(module) : false;
}
