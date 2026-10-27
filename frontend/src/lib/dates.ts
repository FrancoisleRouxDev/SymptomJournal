const TZ_SUFFIX = /(Z|[+-]\d{2}:?\d{2})$/;

/**
 * Parse a backend timestamp. Timestamps are stored in UTC but can arrive
 * without an offset (e.g. "2026-10-27T08:00:00"), which JS would otherwise
 * read as local time. Extra fractional digits are trimmed to milliseconds.
 */
export function parseTimestamp(ts: string): Date {
  const trimmed = ts.replace(/(\.\d{3})\d+/, '$1');
  return new Date(TZ_SUFFIX.test(trimmed) ? trimmed : `${trimmed}Z`);
}

/** Format a date as YYYY-MM-DD in the device's local time zone. */
export function toLocalDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Local calendar day (YYYY-MM-DD) that a backend timestamp falls on. */
export function timestampDateKey(ts: string): string {
  return toLocalDateKey(parseTimestamp(ts));
}
