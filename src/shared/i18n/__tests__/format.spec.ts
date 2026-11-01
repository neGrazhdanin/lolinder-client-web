import { describe, expect, it } from 'vitest';
import { formatGameClock, formatRelativeTime, ordinalForm } from '../format';

const now = new Date('2026-10-25T12:00:00Z');
const ago = (seconds: number) => new Date(now.getTime() - seconds * 1000);

describe('formatRelativeTime', () => {
  it('picks the largest whole unit', () => {
    expect(formatRelativeTime(ago(4 * 60), now, 'en')).toBe('4 minutes ago');
    expect(formatRelativeTime(ago(3 * 3600), now, 'en')).toBe('3 hours ago');
    expect(formatRelativeTime(ago(6 * 86400), now, 'en')).toBe('6 days ago');
  });

  it('keeps a number instead of phrases like "yesterday" or "last week"', () => {
    expect(formatRelativeTime(ago(86400), now, 'en')).toBe('1 day ago');
    expect(formatRelativeTime(ago(8 * 86400), now, 'en', 'short')).toBe('1 wk. ago');
    expect(formatRelativeTime(ago(8 * 86400), now, 'ru', 'short')).toBe('1 нед. назад');
    expect(formatRelativeTime(ago(86400), now, 'ru')).toBe('1 день назад');
  });

  it('says "now" under a minute instead of counting seconds', () => {
    expect(formatRelativeTime(ago(20), now, 'en')).toBe('now');
  });

  it('uses Russian plural forms', () => {
    expect(formatRelativeTime(ago(2 * 60), now, 'ru')).toBe('2 минуты назад');
    expect(formatRelativeTime(ago(5 * 60), now, 'ru')).toBe('5 минут назад');
  });
});

describe('formatGameClock', () => {
  it('shows minutes and zero-padded seconds', () => {
    expect(formatGameClock(28 * 60 + 31)).toBe('28:31');
    expect(formatGameClock(3 * 60 + 4)).toBe('3:04');
  });

  it('adds hours only past the hour', () => {
    expect(formatGameClock(3600 + 2 * 60 + 3)).toBe('1:02:03');
  });

  it('rounds fractional and clamps negative input', () => {
    expect(formatGameClock(59.6)).toBe('1:00');
    expect(formatGameClock(-5)).toBe('0:00');
  });
});

describe('ordinalForm', () => {
  it('picks English ordinal suffix forms', () => {
    expect([1, 2, 3, 4, 11, 21, 22].map((place) => ordinalForm(place, 'en'))).toEqual([
      'one',
      'two',
      'few',
      'other',
      'other',
      'one',
      'two',
    ]);
  });

  it('has a single form in Russian', () => {
    expect([1, 2, 3, 5].map((place) => ordinalForm(place, 'ru'))).toEqual([
      'other',
      'other',
      'other',
      'other',
    ]);
  });
});
