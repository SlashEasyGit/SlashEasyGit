import * as Sentry from '@sentry/node';

import { env } from './config/env';

let initialised = false;

export function initSentry(): void {
  if (!env.SENTRY_DSN) return;
  if (initialised) return;
  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    release: env.BUILD_SHA,
    tracesSampleRate: env.NODE_ENV === 'production' ? 0.05 : 1.0,
  });
  initialised = true;
}

export { Sentry };
