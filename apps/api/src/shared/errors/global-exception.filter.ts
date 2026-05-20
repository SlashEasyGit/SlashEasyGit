import { ArgumentsHost, Catch, type ExceptionFilter, HttpException, Logger } from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';

import { Sentry } from '../sentry/sentry.init';
import { AppError } from './app-error';

interface RequestWithId extends FastifyRequest {
  id: string;
}

/**
 * Global exception filter — produces the wire shape from docs/API_CONVENTIONS.md §5.
 *
 * Resolution order:
 *   1. AppError → use its code, message, status, details.
 *   2. ZodError → 400 VALIDATION_ERROR with `details.fields`.
 *   3. HttpException → translate Nest's built-in errors to our envelope.
 *   4. Anything else → 500 INTERNAL_ERROR, logged with stack, sent to Sentry.
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<RequestWithId>();
    const res = ctx.getResponse<FastifyReply>();
    const requestId = req.id ?? 'unknown';

    if (exception instanceof AppError) {
      res.status(exception.httpStatus).send({
        error: {
          code: exception.code,
          message: exception.message,
          details: exception.details,
          requestId,
        },
      });
      return;
    }

    if (exception instanceof ZodError) {
      const fields: Record<string, { code: string; message: string }> = {};
      for (const issue of exception.issues) {
        const path = issue.path.join('.');
        if (path && !fields[path]) {
          fields[path] = { code: issue.code.toUpperCase(), message: issue.message };
        }
      }
      res.status(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Some fields are invalid.',
          details: { fields },
          requestId,
        },
      });
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      const message = typeof body === 'string' ? body : (body as { message?: string }).message ?? 'HTTP error';
      res.status(status).send({
        error: {
          code: codeForHttpStatus(status),
          message,
          requestId,
        },
      });
      return;
    }

    // Unhandled — 500.
    const err = exception instanceof Error ? exception : new Error(String(exception));
    this.logger.error(err.message, err.stack);
    Sentry.captureException(err, { tags: { requestId } });
    res.status(500).send({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Something went wrong on our side. Please try again, and contact support if it persists.',
        requestId,
      },
    });
  }
}

function codeForHttpStatus(status: number): string {
  if (status === 400) return 'BAD_REQUEST';
  if (status === 401) return 'UNAUTHENTICATED';
  if (status === 403) return 'PERMISSION_DENIED';
  if (status === 404) return 'NOT_FOUND';
  if (status === 409) return 'CONFLICT';
  if (status === 422) return 'BUSINESS_RULE_VIOLATION';
  if (status === 429) return 'RATE_LIMITED';
  if (status >= 500) return 'INTERNAL_ERROR';
  return 'BAD_REQUEST';
}
