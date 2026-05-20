/**
 * Bounded retry with jittered exponential backoff.
 * Use sparingly — most retries belong in BullMQ, not inline.
 */

export interface RetryOptions {
  /** Maximum number of attempts including the first. Default 3. */
  attempts?: number;
  /** Base delay in ms. Default 200. */
  baseDelayMs?: number;
  /** Max delay in ms. Default 5000. */
  maxDelayMs?: number;
  /** Predicate to decide if an error is retryable. Default: retry on anything. */
  shouldRetry?: (error: unknown, attempt: number) => boolean;
  /** Hook for observability. */
  onRetry?: (error: unknown, attempt: number, delayMs: number) => void;
}

export async function retry<T>(fn: () => Promise<T>, opts: RetryOptions = {}): Promise<T> {
  const attempts = opts.attempts ?? 3;
  const base = opts.baseDelayMs ?? 200;
  const max = opts.maxDelayMs ?? 5000;
  const shouldRetry = opts.shouldRetry ?? (() => true);

  let lastErr: unknown;
  for (let i = 1; i <= attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (i === attempts || !shouldRetry(err, i)) {
        throw err;
      }
      const exp = Math.min(max, base * 2 ** (i - 1));
      const jitter = Math.random() * exp * 0.3;
      const delay = exp + jitter;
      opts.onRetry?.(err, i, delay);
      await sleep(delay);
    }
  }
  // Unreachable.
  throw lastErr;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
