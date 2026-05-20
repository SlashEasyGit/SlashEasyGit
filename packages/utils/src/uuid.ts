/**
 * UUID helpers.
 *
 * v7 is preferred for primary keys (time-ordered → friendly to B-tree indexes).
 * v4 is for things that should not leak time (idempotency keys, refresh tokens before hashing).
 */

import { v4, v7, validate } from 'uuid';

export function uuidv4(): string {
  return v4();
}

export function uuidv7(): string {
  return v7();
}

export function isValidUuid(s: string): boolean {
  return typeof s === 'string' && validate(s);
}
