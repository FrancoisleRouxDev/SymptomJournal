import { parseTimestamp, timestampDateKey, toLocalDateKey } from '../lib/dates';

describe('parseTimestamp', () => {
  it('treats timestamps without an offset as UTC', () => {
    expect(parseTimestamp('2026-10-27T08:00:00').toISOString()).toBe('2026-10-27T08:00:00.000Z');
  });

  it('keeps explicit offsets', () => {
    expect(parseTimestamp('2026-10-27T08:00:00Z').toISOString()).toBe('2026-10-27T08:00:00.000Z');
    expect(parseTimestamp('2026-10-27T10:00:00+02:00').toISOString()).toBe('2026-10-27T08:00:00.000Z');
  });

  it('trims microseconds to milliseconds', () => {
    expect(parseTimestamp('2026-10-27T08:00:00.123456').toISOString()).toBe('2026-10-27T08:00:00.123Z');
  });
});

describe('toLocalDateKey', () => {
  it('uses the local calendar day', () => {
    expect(toLocalDateKey(new Date(2026, 9, 27, 0, 30))).toBe('2026-10-27');
    expect(toLocalDateKey(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
  });
});

describe('timestampDateKey', () => {
  it('matches the local day of the parsed timestamp', () => {
    const ts = '2026-10-26T23:30:00';
    expect(timestampDateKey(ts)).toBe(toLocalDateKey(parseTimestamp(ts)));
  });
});
