import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Player } from '@/shared/api';
import {
  abortableWait,
  lookupPlayer,
  MAX_LOOKUP_ATTEMPTS,
  parseRetryAfter,
  retryDelay,
  type SearchRequest,
  type SearchResponse,
  type Wait,
} from '../lookup';

const player: Player = {
  puuid: 'p'.repeat(78),
  gameName: 'Diamondprox',
  tagLine: 'ProX',
  platform: 'euw1',
  profileIconId: 564,
  summonerLevel: 971,
  sync: { status: 'fresh', lastSyncedAt: '2026-10-25T12:00:00.000Z' },
};
const query = { platform: 'euw1', gameName: 'Diamondprox', tagLine: 'ProX' } as const;

const found: SearchResponse = { status: 200, data: player, retryAfter: null };
const pending = (retryAfter: string | null = '1'): SearchResponse => ({
  status: 202,
  data: { status: 'pending' },
  retryAfter,
});

function requestSequence(...responses: SearchResponse[]) {
  const request = vi.fn<SearchRequest>();
  for (const response of responses) request.mockResolvedValueOnce(response);
  return request;
}

describe('parseRetryAfter', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('reads delta seconds and HTTP dates', () => {
    expect(parseRetryAfter('3')).toBe(3000);
    expect(parseRetryAfter('Sun, 25 Oct 2026 12:00:05 GMT', Date.UTC(2026, 9, 25, 12))).toBe(5000);
  });

  it('is undefined when the header is missing or garbage', () => {
    expect(parseRetryAfter(null)).toBeUndefined();
    expect(parseRetryAfter('')).toBeUndefined();
    expect(parseRetryAfter('soon')).toBeUndefined();
  });
});

describe('retryDelay', () => {
  it('falls back to a default when the header is unreadable cross-origin', () => {
    expect(retryDelay(null)).toBe(2000);
  });

  it('clamps hostile values', () => {
    expect(retryDelay('0')).toBe(500);
    expect(retryDelay('3600')).toBe(15_000);
  });
});

describe('lookupPlayer', () => {
  it('returns the player from a direct 200', async () => {
    const wait = vi.fn<Wait>();
    await expect(lookupPlayer(query, { request: requestSequence(found), wait })).resolves.toEqual(
      player,
    );
    expect(wait).not.toHaveBeenCalled();
  });

  it('repeats the same request after Retry-After while the API answers 202', async () => {
    const request = requestSequence(pending('1'), pending('4'), found);
    const wait = vi.fn<Wait>(async () => {});
    const onPending = vi.fn<(attempt: number) => void>();

    await expect(lookupPlayer(query, { request, wait, onPending })).resolves.toEqual(player);

    expect(request).toHaveBeenCalledTimes(3);
    expect(request.mock.calls.every(([sent]) => sent === query)).toBe(true);
    expect(wait.mock.calls.map(([ms]) => ms)).toEqual([1000, 4000]);
    expect(onPending.mock.calls.map(([attempt]) => attempt)).toEqual([1, 2]);
  });

  it('gives up with SERVICE_UNAVAILABLE after the attempt limit', async () => {
    const request = vi.fn<SearchRequest>().mockResolvedValue(pending());
    const wait = vi.fn<Wait>(async () => {});

    await expect(lookupPlayer(query, { request, wait })).rejects.toEqual({
      code: 'SERVICE_UNAVAILABLE',
    });
    expect(request).toHaveBeenCalledTimes(MAX_LOOKUP_ATTEMPTS);
  });

  it('lets API errors such as PLAYER_NOT_FOUND through untouched', async () => {
    const request = vi.fn<SearchRequest>().mockRejectedValue({ code: 'PLAYER_NOT_FOUND' });
    await expect(lookupPlayer(query, { request })).rejects.toEqual({ code: 'PLAYER_NOT_FOUND' });
  });

  it('stops waiting when the query is cancelled', async () => {
    vi.useFakeTimers();
    const controller = new AbortController();
    const request = vi.fn<SearchRequest>().mockResolvedValue(pending('10'));

    const result = lookupPlayer(query, { request, wait: abortableWait, signal: controller.signal });
    await vi.advanceTimersByTimeAsync(0);
    controller.abort(new DOMException('left the page', 'AbortError'));

    await expect(result).rejects.toThrow('left the page');
    expect(request).toHaveBeenCalledTimes(1);
  });
});
