/**
 * AppError — the canonical error type for business-rule violations.
 *
 * Per docs/API_CONVENTIONS.md §5, every error response has shape:
 *   { error: { code, message, details?, requestId } }
 *
 * Throwing AppError anywhere in the request path produces that response.
 * Throwing a non-AppError gets mapped to INTERNAL_ERROR and logged with stack.
 */

import type { ErrorCode } from '@tcharts/domain';

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly httpStatus: number;
  public readonly details?: Record<string, unknown>;

  constructor(
    code: ErrorCode,
    message: string,
    options: { httpStatus?: number; details?: Record<string, unknown>; cause?: Error } = {},
  ) {
    super(message, { cause: options.cause });
    this.name = 'AppError';
    this.code = code;
    this.httpStatus = options.httpStatus ?? defaultHttpStatusFor(code);
    if (options.details !== undefined) this.details = options.details;
  }
}

function defaultHttpStatusFor(code: ErrorCode): number {
  switch (code) {
    case 'VALIDATION_ERROR':
    case 'BAD_REQUEST':
      return 400;
    case 'UNAUTHENTICATED':
    case 'TOKEN_EXPIRED':
      return 401;
    case 'PERMISSION_DENIED':
    case 'COMPANY_ACCESS_DENIED':
    case 'SELF_APPROVAL_DENIED':
    case 'INSUFFICIENT_ROLE':
    case 'HUB_ACCESS_DENIED':
    case 'DEFAULT_ACCOUNT_NOT_DELETABLE':
      return 403;
    case 'NOT_FOUND':
      return 404;
    case 'PERIOD_HARD_CLOSED':
    case 'PERIOD_SOFT_CLOSED':
    case 'JE_UNBALANCED':
    case 'ACCOUNT_INACTIVE':
    case 'ACCOUNT_TYPE_LOCKED':
    case 'PARENT_TYPE_MISMATCH':
    case 'CONTROL_ACCOUNT_LOCKED':
    case 'SYSTEM_MANAGED_ACCOUNT':
    case 'TAX_INACTIVE':
    case 'STATE_TAX_ALREADY_EXISTS':
    case 'IDEMPOTENCY_KEY_REUSE':
    case 'CONFLICT':
    case 'OVERPAYMENT':
    case 'VOID_BLOCKED_BY_PAYMENT':
    case 'USER_NOT_IN_COMPANY':
    case 'INVOICE_EMPTY':
      return 409;
    case 'BUSINESS_RULE_VIOLATION':
      return 422;
    case 'RATE_LIMITED':
      return 429;
    case 'MIME_NOT_ALLOWED':
      return 415;
    case 'FILE_TOO_LARGE':
      return 413;
    case 'NOT_IMPLEMENTED':
      return 501;
    case 'SERVICE_UNAVAILABLE':
      return 503;
    case 'STORAGE_QUOTA_EXCEEDED':
      return 507;
    case 'INTERNAL_ERROR':
    default:
      return 500;
  }
}
