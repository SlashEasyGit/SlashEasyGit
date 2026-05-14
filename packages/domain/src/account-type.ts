/**
 * COA account types and their numbering ranges.
 * Source: COA Spec v1.0 + DOC1 §6.5.
 *
 * Account-number range validation enforces AC-INT-09:
 * "Account number must fall within the valid range for the chosen Account Type."
 */

export const ACCOUNT_TYPES = ['Asset', 'Liability', 'Equity', 'Income', 'Expense'] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];

export interface AccountNumberRange {
  readonly min: number;
  readonly max: number;
}

/** Inclusive ranges, per COA Spec v1.0 §5. */
export const ACCOUNT_NUMBER_RANGES: Record<AccountType, AccountNumberRange> = {
  Asset: { min: 1000, max: 1999 },
  Liability: { min: 2000, max: 2999 },
  Equity: { min: 3000, max: 3999 },
  Income: { min: 4000, max: 4999 },
  Expense: { min: 5000, max: 9999 },
};

/**
 * "Normal balance" direction per accounting basics — used to compute running
 * balances and report sign without bespoke logic per account.
 *
 * Asset, Expense: normal-balance debit.
 * Liability, Equity, Income: normal-balance credit.
 */
export type NormalBalance = 'debit' | 'credit';

export const NORMAL_BALANCE: Record<AccountType, NormalBalance> = {
  Asset: 'debit',
  Liability: 'credit',
  Equity: 'credit',
  Income: 'credit',
  Expense: 'debit',
};

export function isValidAccountNumberFor(type: AccountType, number: number): boolean {
  const range = ACCOUNT_NUMBER_RANGES[type];
  return Number.isInteger(number) && number >= range.min && number <= range.max;
}

export function accountTypeFromNumber(number: number): AccountType | null {
  for (const t of ACCOUNT_TYPES) {
    if (isValidAccountNumberFor(t, number)) return t;
  }
  return null;
}
