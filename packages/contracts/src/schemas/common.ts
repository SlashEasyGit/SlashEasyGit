import { z } from 'zod';

/** Canonical money wire format: 4 decimal places, no separators. */
export const MoneyStringSchema = z
  .string()
  .regex(/^-?\d+\.\d{4}$/, 'Money must be a string with exactly 4 decimal places (e.g., "1234.5600")');

export type MoneyString = z.infer<typeof MoneyStringSchema>;

/** Calendar date wire format: ISO `YYYY-MM-DD`. */
export const CalendarDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Calendar date must be ISO YYYY-MM-DD');

export type CalendarDate = z.infer<typeof CalendarDateSchema>;

/** UTC timestamp wire format: ISO 8601 with `Z`. */
export const TimestampSchema = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/,
    'Timestamp must be ISO 8601 UTC (e.g., "2026-05-12T10:00:00.000Z")',
  );

export type Timestamp = z.infer<typeof TimestampSchema>;

export const UuidSchema = z.string().uuid();
export type Uuid = z.infer<typeof UuidSchema>;

/** Cross-cutting error envelope schema (matches docs/API_CONVENTIONS.md §5). */
export const ApiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.unknown()).optional(),
    requestId: z.string(),
  }),
});

export type ApiError = z.infer<typeof ApiErrorSchema>;

/** Pagination shapes. */
export const CursorPageSchema = z.object({
  kind: z.literal('cursor'),
  nextCursor: z.string().nullable(),
  hasMore: z.boolean(),
  limit: z.number().int().positive(),
});

export const OffsetPageSchema = z.object({
  kind: z.literal('offset'),
  page: z.number().int().positive(),
  perPage: z.number().int().positive(),
  total: z.number().int().nonnegative(),
});

export const PageSchema = z.discriminatedUnion('kind', [CursorPageSchema, OffsetPageSchema]);

export type Page = z.infer<typeof PageSchema>;

/** Standard success envelope for a single resource. */
export function envelopeOf<T extends z.ZodTypeAny>(schema: T) {
  return z.object({
    data: schema,
    meta: z.object({ requestId: z.string() }),
  });
}

/** Standard success envelope for a collection. */
export function collectionEnvelopeOf<T extends z.ZodTypeAny>(schema: T) {
  return z.object({
    data: z.array(schema),
    meta: z.object({
      requestId: z.string(),
      page: PageSchema,
    }),
  });
}
