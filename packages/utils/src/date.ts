/**
 * Date helpers.
 *
 * Two date kinds in Tcharts:
 *  - "calendar date" — typed `Date` but only year/month/day matter; represents
 *    a day in the company's reporting timezone (the `recognize_date` column).
 *  - "timestamp"      — typed `Date` representing a UTC instant.
 *
 * These helpers exist so the boundary between the two is explicit in code.
 */

import {
  endOfMonth as _endOfMonth,
  startOfMonth as _startOfMonth,
  format as _format,
  parseISO,
  isValid,
} from 'date-fns';
import { formatInTimeZone, fromZonedTime, toZonedTime } from 'date-fns-tz';

/**
 * Parse an ISO date-only string `"YYYY-MM-DD"` into a Date.
 * The resulting Date is at midnight UTC; callers should treat it as a calendar date.
 */
export function parseCalendarDate(iso: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    throw new RangeError(`Invalid calendar date: "${iso}". Expected YYYY-MM-DD.`);
  }
  const d = parseISO(iso);
  if (!isValid(d)) {
    throw new RangeError(`Unparseable calendar date: "${iso}".`);
  }
  return d;
}

/** Format a Date as `"YYYY-MM-DD"` (calendar date wire format). */
export function formatCalendarDate(date: Date): string {
  return _format(date, 'yyyy-MM-dd');
}

/** Format a UTC Date in a target timezone, e.g., for display in the company's TZ. */
export function formatInZone(date: Date, timeZone: string, fmt = 'yyyy-MM-dd HH:mm:ssXXX'): string {
  return formatInTimeZone(date, timeZone, fmt);
}

/** Convert a UTC instant to a Date as it appears in the given timezone. */
export function utcToZoned(date: Date, timeZone: string): Date {
  return toZonedTime(date, timeZone);
}

/** Inverse — convert a wall-clock Date in a timezone back to UTC. */
export function zonedToUtc(date: Date, timeZone: string): Date {
  return fromZonedTime(date, timeZone);
}

/**
 * Convert a "select a month" value (e.g., 2026-03) into the last day of that month.
 * Used by Period Control where Admin selects a month and we store the period end date.
 */
export function endOfMonthFromYearMonth(year: number, monthOneBased: number): Date {
  return _endOfMonth(new Date(Date.UTC(year, monthOneBased - 1, 1)));
}

export function startOfMonthFromYearMonth(year: number, monthOneBased: number): Date {
  return _startOfMonth(new Date(Date.UTC(year, monthOneBased - 1, 1)));
}
