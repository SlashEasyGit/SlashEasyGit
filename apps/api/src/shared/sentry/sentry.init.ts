/**
 * Sentry initialisation.
 *
 * Stub behaviour: if SENTRY_DSN is empty, no Sentry calls are made — `Sentry.captureException`
 * still exists but is a no-op. The application logs errors to Pino regardless.
 *
 * This lets us ship Sprint 0 without a Sentry account; just provide the DSN later.
 */

import * as Sentry from '@sentry/node';

import { env } from '../../config/env';

let initialised = false;

export function initSentry(): void {
  if (!env.SENTRY_DSN) {
    // Stub mode — leave Sentry uninitialised. captureException is a no-op without init.
    return;
  }
  if (initialised) return;
  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    release: env.BUILD_SHA,
    tracesSampleRate: env.NODE_ENV === 'production' ? 0.1 : 1.0,
    integrations: [
      Sentry.httpIntegration(),
      Sentry.expressIntegration(),
    ],
  });
  initialised = true;
}

export { Sentry };
