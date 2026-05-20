/**
 * Domain error codes. Stable strings — the frontend dispatches on these.
 * Adding a new code requires updating docs/API_CONVENTIONS.md in the same PR.
 *
 * The enum is `as const` so unknown codes are caught at compile time.
 */

export const ERROR_CODES = [
  // Validation / shape
  'VALIDATION_ERROR',
  'BAD_REQUEST',

  // Auth
  'UNAUTHENTICATED',
  'TOKEN_EXPIRED',

  // Authz
  'PERMISSION_DENIED',
  'COMPANY_ACCESS_DENIED',
  'SELF_APPROVAL_DENIED',
  'INSUFFICIENT_ROLE',

  // Not found
  'NOT_FOUND',

  // Conflict / business
  'PERIOD_HARD_CLOSED',
  'PERIOD_SOFT_CLOSED',
  'JE_UNBALANCED',
  'ACCOUNT_INACTIVE',
  'ACCOUNT_TYPE_LOCKED',
  'PARENT_TYPE_MISMATCH',
  'CONTROL_ACCOUNT_LOCKED',
  'DEFAULT_ACCOUNT_NOT_DELETABLE',
  'SYSTEM_MANAGED_ACCOUNT',
  'TAX_INACTIVE',
  'STATE_TAX_ALREADY_EXISTS',
  'IDEMPOTENCY_KEY_REUSE',
  'CONFLICT',
  'OVERPAYMENT',
  'VOID_BLOCKED_BY_PAYMENT',
  'USER_NOT_IN_COMPANY',
  'INVOICE_EMPTY',
  'MIME_NOT_ALLOWED',
  'FILE_TOO_LARGE',
  'HUB_ACCESS_DENIED',
  'STORAGE_QUOTA_EXCEEDED',

  // Generic
  'BUSINESS_RULE_VIOLATION',
  'RATE_LIMITED',
  'INTERNAL_ERROR',
  'NOT_IMPLEMENTED',
  'SERVICE_UNAVAILABLE',
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

export interface AppErrorShape {
  code: ErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * The wire shape of an API error response (matches docs/API_CONVENTIONS.md §5).
 */
export interface ApiErrorEnvelope {
  error: AppErrorShape & {
    requestId: string;
  };
}
