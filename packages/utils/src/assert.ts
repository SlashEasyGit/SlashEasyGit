/**
 * Runtime assertions for invariants that should never fail in correct code.
 * Failures throw and are typed as `never` so the type checker narrows.
 */

export function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(`Invariant failed: ${message}`);
  }
}

export function assertExhaustive(x: never, message?: string): never {
  throw new Error(message ?? `Unhandled discriminant: ${JSON.stringify(x)}`);
}

export function assertNonNull<T>(x: T | null | undefined, message: string): T {
  if (x === null || x === undefined) {
    throw new Error(`Null assertion failed: ${message}`);
  }
  return x;
}
