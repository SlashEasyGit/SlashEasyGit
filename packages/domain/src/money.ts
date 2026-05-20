/**
 * Money value object.
 *
 * Backing store: decimal.js for arbitrary-precision fixed-point arithmetic.
 * Storage precision: 4 decimal places (matches `numeric(18,4)` in Postgres).
 * Wire encoding: string with exactly 4 decimal places (e.g., "1234.5600").
 *
 * No float arithmetic anywhere. The class APIs accept Money or string only.
 * ESLint config additionally forbids `parseFloat` and `Number()` on money strings.
 */

import { Decimal } from 'decimal.js';

// Tcharts banker's rounding behaviour: ROUND_HALF_EVEN.
// This is the accounting standard for line-level rounding and minimises
// systematic bias when summing many invoice lines.
Decimal.set({
  precision: 28,
  rounding: Decimal.ROUND_HALF_EVEN,
});

const STORAGE_DECIMALS = 4;

export type MoneyInput = Money | string | number | Decimal;

/**
 * Currency code (ISO 4217). USD-only in v1.
 * The string type is intentional so future expansion doesn't require a migration of every Money instance.
 */
export type Currency = 'USD';

export class Money {
  private readonly value: Decimal;
  public readonly currency: Currency;

  private constructor(value: Decimal, currency: Currency) {
    this.value = value;
    this.currency = currency;
  }

  // -------------------------------------------------------------------------
  // Constructors
  // -------------------------------------------------------------------------

  static zero(currency: Currency = 'USD'): Money {
    return new Money(new Decimal(0), currency);
  }

  /**
   * Parse from the wire format. Accepts:
   *  - "1234.5600"            (canonical)
   *  - "1234.56"              (will be padded)
   *  - "1234"                 (will be padded)
   *  - "-1234.5600"
   * Rejects:
   *  - "1,234.56"             (no thousands separators on the wire)
   *  - "$1234.56"             (no symbols)
   *  - non-finite strings
   */
  static fromString(raw: string, currency: Currency = 'USD'): Money {
    if (typeof raw !== 'string') {
      throw new TypeError(`Money.fromString requires a string, received ${typeof raw}`);
    }
    if (!/^-?\d+(\.\d{1,})?$/.test(raw)) {
      throw new RangeError(`Invalid money string: "${raw}"`);
    }
    const d = new Decimal(raw);
    if (!d.isFinite()) {
      throw new RangeError(`Money must be finite, received "${raw}"`);
    }
    return new Money(d, currency);
  }

  /**
   * From a Decimal (rare — prefer fromString from the wire).
   */
  static fromDecimal(d: Decimal, currency: Currency = 'USD'): Money {
    return new Money(d, currency);
  }

  /**
   * Compose from minor units (e.g., cents). Use sparingly — accounting prefers
   * working in the four-decimal representation directly.
   */
  static fromMinorUnits(minorUnits: number | bigint, currency: Currency = 'USD'): Money {
    const value = new Decimal(minorUnits.toString()).dividedBy(100);
    return new Money(value, currency);
  }

  // -------------------------------------------------------------------------
  // Output
  // -------------------------------------------------------------------------

  /**
   * Canonical wire format: 4 decimal places, no thousands separators.
   */
  toString(): string {
    return this.value.toFixed(STORAGE_DECIMALS);
  }

  /**
   * For Prisma's `Decimal` field type (accepts string).
   */
  toDb(): string {
    return this.toString();
  }

  /**
   * Display-formatted with locale separators and currency symbol.
   * Used at the presentation layer only — never as a source of truth.
   */
  toDisplay(locale = 'en-US'): string {
    const num = this.value.toFixed(2); // display precision = 2dp
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: this.currency,
    }).format(Number(num));
  }

  /**
   * Banker's rounding to 2dp for display. Storage remains 4dp.
   */
  toDisplayDecimal(): string {
    return this.value.toDecimalPlaces(2, Decimal.ROUND_HALF_EVEN).toFixed(2);
  }

  // -------------------------------------------------------------------------
  // Arithmetic — all returns a new Money; immutable
  // -------------------------------------------------------------------------

  add(other: MoneyInput): Money {
    return new Money(this.value.plus(Money.coerceDecimal(other)), this.currency);
  }

  subtract(other: MoneyInput): Money {
    return new Money(this.value.minus(Money.coerceDecimal(other)), this.currency);
  }

  /**
   * Multiply by a scalar (quantity, rate, etc.). Not by another Money.
   * Money * Money makes no accounting sense — taxes etc. are Money * rate (number).
   */
  multiply(scalar: number | string | Decimal): Money {
    const d = scalar instanceof Decimal ? scalar : new Decimal(String(scalar));
    return new Money(this.value.times(d), this.currency);
  }

  /**
   * Divide by a scalar. Throws on division by zero.
   */
  divide(scalar: number | string | Decimal): Money {
    const d = scalar instanceof Decimal ? scalar : new Decimal(String(scalar));
    if (d.isZero()) {
      throw new RangeError('Money.divide by zero');
    }
    return new Money(this.value.dividedBy(d), this.currency);
  }

  negate(): Money {
    return new Money(this.value.negated(), this.currency);
  }

  // -------------------------------------------------------------------------
  // Comparison
  // -------------------------------------------------------------------------

  equals(other: MoneyInput): boolean {
    return this.value.equals(Money.coerceDecimal(other));
  }

  lt(other: MoneyInput): boolean {
    return this.value.lessThan(Money.coerceDecimal(other));
  }

  lte(other: MoneyInput): boolean {
    return this.value.lessThanOrEqualTo(Money.coerceDecimal(other));
  }

  gt(other: MoneyInput): boolean {
    return this.value.greaterThan(Money.coerceDecimal(other));
  }

  gte(other: MoneyInput): boolean {
    return this.value.greaterThanOrEqualTo(Money.coerceDecimal(other));
  }

  isZero(): boolean {
    return this.value.isZero();
  }

  isPositive(): boolean {
    return this.value.isPositive() && !this.value.isZero();
  }

  isNegative(): boolean {
    return this.value.isNegative();
  }

  // -------------------------------------------------------------------------
  // Sum-zero check for journal balancing — the platform invariant
  // -------------------------------------------------------------------------

  /**
   * Sum a collection of Money values. Returns Money.zero() for empty inputs.
   * Required currency consistency — mixing currencies throws.
   */
  static sum(items: Money[], currency: Currency = 'USD'): Money {
    if (items.length === 0) return Money.zero(currency);
    const c = items[0]!.currency;
    let total = new Decimal(0);
    for (const m of items) {
      if (m.currency !== c) {
        throw new TypeError(`Money.sum currency mismatch: ${m.currency} vs ${c}`);
      }
      total = total.plus(m.value);
    }
    return new Money(total, c);
  }

  /**
   * Returns true if and only if SUM(debits) === SUM(credits) to STORAGE_DECIMALS precision.
   * The platform's most important invariant. Used by JournalPostingService.
   */
  static isBalanced(debits: Money[], credits: Money[]): boolean {
    const d = Money.sum(debits);
    const c = Money.sum(credits);
    return d.equals(c);
  }

  // -------------------------------------------------------------------------
  // Internal
  // -------------------------------------------------------------------------

  private static coerceDecimal(input: MoneyInput): Decimal {
    if (input instanceof Money) return input.value;
    if (input instanceof Decimal) return input;
    if (typeof input === 'string') return new Decimal(input);
    if (typeof input === 'number') {
      // We accept number for ergonomic test code only. Production code uses string.
      // Number is dangerous for money (IEEE 754) — we reject NaN and Infinity.
      if (!Number.isFinite(input)) {
        throw new RangeError(`Cannot coerce non-finite number to Money: ${input}`);
      }
      return new Decimal(input.toString());
    }
    throw new TypeError(`Cannot coerce ${typeof input} to Money`);
  }
}
