import { describe, expect, it } from 'vitest';
import { formatRelativeTime } from '../format';

const now = new Date('2026-10-25T12:00:00Z');
const ago = (seconds: number) => new Date(now.getTime() - seconds * 1000);

describe('formatRelativeTime', () => {
  it('picks the largest whole unit', () => {
    expect(formatRelativeTime(ago(4 * 60), now, 'en')).toBe('4 minutes ago');
    expect(formatRelativeTime(ago(3 * 3600), now, 'en')).toBe('3 hours ago');
    expect(formatRelativeTime(ago(6 * 86400), now, 'en')).toBe('6 days ago');
  });

  it('says "now" under a minute instead of counting seconds', () => {
    expect(formatRelativeTime(ago(20), now, 'en')).toBe('now');
  });

  it('uses Russian plural forms', () => {
    expect(formatRelativeTime(ago(2 * 60), now, 'ru')).toBe('2 минуты назад');
    expect(formatRelativeTime(ago(5 * 60), now, 'ru')).toBe('5 минут назад');
  });
});
