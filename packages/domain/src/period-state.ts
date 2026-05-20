/**
 * Period Control states per Period Control Spec v1.1.
 *
 * A company is in exactly one state per period (per RecognizeDate range).
 * The gate is computed dynamically by PeriodControlService.assertCanPost() —
 * we don't store a "state" on the row; we compare RecognizeDate against the
 * company's softClosePeriodEnd and hardClosePeriodEnd.
 *
 * This enum is the surface for UI badges and audit log actions.
 */

export type PeriodState = 'Open' | 'SoftClosed' | 'HardClosed';

export interface PeriodControlSnapshot {
  readonly softClosePeriodEnd: Date | null; // null = period control not enabled
  readonly hardClosePeriodEnd: Date | null;
  readonly enabled: boolean;
}

/**
 * Computes the state of a given RecognizeDate against a period control snapshot.
 * Pure function — does not consider role.
 *
 * Critical: comparison is "<=", not "<". A RecognizeDate exactly on the close-end
 * date is INSIDE the closed period (per PCM-12 in Period Control Spec).
 */
export function stateForRecognizeDate(
  recognizeDate: Date,
  snapshot: PeriodControlSnapshot,
): PeriodState {
  if (!snapshot.enabled) return 'Open';

  if (snapshot.hardClosePeriodEnd && recognizeDate <= snapshot.hardClosePeriodEnd) {
    return 'HardClosed';
  }
  if (snapshot.softClosePeriodEnd && recognizeDate <= snapshot.softClosePeriodEnd) {
    return 'SoftClosed';
  }
  return 'Open';
}
