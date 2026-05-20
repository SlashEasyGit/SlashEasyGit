/**
 * Utility for composing class names.
 * Uses tailwind-merge so conflicting Tailwind utilities resolve correctly.
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
