import { describe, expect, it } from 'vitest';
import { parseRiotId, riotIdFromSlug, riotIdToSlug } from '../riot-id';

describe('parseRiotId', () => {
  it('accepts the full-width ＃ that CJK keyboards type', () => {
    expect(parseRiotId('Faker＃KR1')).toEqual({
      ok: true,
      value: { gameName: 'Faker', tagLine: 'KR1' },
    });
  });

  it('splits name and tag', () => {
    expect(parseRiotId('Diamondprox#ProX')).toEqual({
      ok: true,
      value: { gameName: 'Diamondprox', tagLine: 'ProX' },
    });
  });

  it('trims the input and the parts around #', () => {
    expect(parseRiotId('  Hide on bush  #  KR1 ')).toEqual({
      ok: true,
      value: { gameName: 'Hide on bush', tagLine: 'KR1' },
    });
  });

  it('collapses repeated spaces inside the name', () => {
    expect(parseRiotId('Hide   on bush#KR1')).toMatchObject({
      value: { gameName: 'Hide on bush' },
    });
  });

  it('accepts non-Latin names and tags', () => {
    expect(parseRiotId('Ромашка#РУ1')).toEqual({
      ok: true,
      value: { gameName: 'Ромашка', tagLine: 'РУ1' },
    });
  });

  it('reports an empty input', () => {
    expect(parseRiotId('   ')).toEqual({ ok: false, error: 'empty' });
  });

  it('reports a missing tag', () => {
    expect(parseRiotId('Faker')).toEqual({ ok: false, error: 'missingTag' });
    expect(parseRiotId('Faker#')).toEqual({ ok: false, error: 'missingTag' });
    expect(parseRiotId('Faker#   ')).toEqual({ ok: false, error: 'missingTag' });
  });

  it('rejects an empty, too long or double-hashed name', () => {
    expect(parseRiotId('#EUW')).toEqual({ ok: false, error: 'invalidName' });
    expect(parseRiotId('a'.repeat(17) + '#EUW')).toEqual({ ok: false, error: 'invalidName' });
    expect(parseRiotId('a#b#EUW')).toEqual({ ok: false, error: 'invalidName' });
  });

  it('rejects tags with spaces, symbols or more than 5 characters', () => {
    expect(parseRiotId('Faker#K R1')).toEqual({ ok: false, error: 'invalidTag' });
    expect(parseRiotId('Faker#KR-1')).toEqual({ ok: false, error: 'invalidTag' });
    expect(parseRiotId('Faker#KOREA1')).toEqual({ ok: false, error: 'invalidTag' });
  });
});

describe('Riot ID slugs', () => {
  it('round-trips through the URL form', () => {
    const riotId = { gameName: 'Hide on bush', tagLine: 'KR1' };
    expect(riotIdToSlug(riotId)).toBe('Hide on bush-KR1');
    expect(riotIdFromSlug(riotIdToSlug(riotId))).toEqual(riotId);
  });

  it('splits on the last dash, since tags never contain one', () => {
    expect(riotIdFromSlug('Jean-Luc-EUW')).toEqual({ gameName: 'Jean-Luc', tagLine: 'EUW' });
  });

  it('returns null for slugs without a tag', () => {
    expect(riotIdFromSlug('Faker')).toBeNull();
    expect(riotIdFromSlug('-KR1')).toBeNull();
    expect(riotIdFromSlug('Faker-')).toBeNull();
  });
});
