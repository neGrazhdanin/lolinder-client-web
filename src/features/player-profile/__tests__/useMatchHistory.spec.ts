import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query';
import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, ref } from 'vue';
import type { MatchHistoryItem, MatchHistoryPage } from '@/shared/api';
import { client } from '@/shared/api/generated/client.gen';
import type { PlayerListener } from '@/shared/realtime/player-channel';
import type { MatchQueue } from '@/shared/riot';
import { useLivePlayer } from '../useLivePlayer';
import { useMatchHistory } from '../useMatchHistory';

const listeners = new Map<string, PlayerListener>();
vi.mock('@/shared/realtime/player-channel', () => ({
  playerChannel: () => ({
    subscribe: (puuid: string, listener: PlayerListener) => {
      listeners.set(puuid, listener);
      return () => listeners.delete(puuid);
    },
  }),
}));

const PUUID = 'p'.repeat(78);

const match = (id: number): MatchHistoryItem => ({
  matchId: `EUW1_${id}`,
  queueId: 420,
  patch: '16.21',
  startedAt: new Date(Date.UTC(2026, 9, 25, id)).toISOString(),
  durationSec: 1800,
  remake: false,
  teamId: 100,
  subteamId: null,
  placement: null,
  championId: 103,
  champLevel: 16,
  role: null,
  kills: 1,
  deaths: 1,
  assists: 1,
  damageToChampions: 0,
  goldEarned: 0,
  cs: 0,
  visionScore: 0,
  items: [0, 0, 0, 0, 0, 0, 0],
  summonerSpells: [4, 14],
  runes: { primaryStyle: null, subStyle: null, perks: [], statPerks: [] },
  win: true,
  participants: [],
});

const idle = { newest: false, older: false };
const newest = { newest: true, older: false };

type Answer = (query: URLSearchParams) => MatchHistoryPage;

function fakeApi(answer: Answer) {
  const requests: URLSearchParams[] = [];
  const fetch = vi.fn<typeof globalThis.fetch>(async (input) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    expect(url.pathname).toBe(`/players/${PUUID}/matches`);
    requests.push(url.searchParams);
    return new Response(JSON.stringify(answer(url.searchParams)), {
      headers: { 'content-type': 'application/json' },
    });
  });
  vi.stubGlobal('fetch', fetch);
  return { requests, setAnswer: (next: Answer) => (answer = next) };
}

function mountHistory() {
  const queue = ref<MatchQueue>();
  let history!: ReturnType<typeof useMatchHistory>;
  const Harness = defineComponent({
    setup() {
      history = useMatchHistory(PUUID, queue);
      useLivePlayer(PUUID, {
        isSyncing: () => false,
        isLoadingMatches: () => history.isWaiting.value,
      });
      return () => null;
    },
  });
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  mount(Harness, { global: { plugins: [[VueQueryPlugin, { queryClient }]] } });
  return { history: () => history, queue };
}

describe('useMatchHistory', () => {
  beforeEach(() => {
    // .env.local may be missing; requests need an absolute URL outside a browser
    client.setConfig({ baseUrl: 'http://api.test' });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    listeners.clear();
  });

  it('follows the cursor until the history ends', async () => {
    const api = fakeApi((query) =>
      query.get('cursor') === 'c1'
        ? { items: [match(1)], nextCursor: null, loading: idle }
        : { items: [match(2)], nextCursor: 'c1', loading: idle },
    );
    const { history } = mountHistory();
    await flushPromises();
    expect(history().state.value).toMatchObject({ hasMore: true, complete: false });
    expect(api.requests[0]?.has('cursor')).toBe(false);

    await history().loadMore();
    await flushPromises();
    expect(history().state.value.items.map((item) => item.matchId)).toEqual(['EUW1_2', 'EUW1_1']);
    expect(history().state.value.complete).toBe(true);
  });

  it('sends the queue filter and leaves it out for all games', async () => {
    const api = fakeApi(() => ({ items: [match(1)], nextCursor: null, loading: idle }));
    const { queue } = mountHistory();
    await flushPromises();
    queue.value = 'aram';
    await flushPromises();

    expect(api.requests.map((query) => query.get('queue'))).toEqual([null, 'aram']);
  });

  it('refetches on player:matches-updated until the first games arrive', async () => {
    const api = fakeApi(() => ({ items: [], nextCursor: null, loading: newest }));
    const { history } = mountHistory();
    await flushPromises();
    expect(history().state.value.awaitingFirst).toBe(true);

    api.setAnswer(() => ({ items: [match(1)], nextCursor: 'c1', loading: idle }));
    listeners.get(PUUID)?.onMatchesUpdated();
    await flushPromises();
    expect(history().state.value).toMatchObject({ awaitingFirst: false, hasMore: true });
  });

  it('refetches the list on player:updated, since a sync brings the newest games', async () => {
    const api = fakeApi(() => ({ items: [match(1)], nextCursor: null, loading: idle }));
    mountHistory();
    await flushPromises();

    listeners.get(PUUID)?.onUpdated();
    await flushPromises();
    expect(api.requests).toHaveLength(2);
  });

  it('refetches after joining the room only while a page waits for the worker', async () => {
    const api = fakeApi(() => ({ items: [match(1)], nextCursor: null, loading: idle }));
    mountHistory();
    await flushPromises();
    listeners.get(PUUID)?.onJoined(false);
    await flushPromises();
    expect(api.requests).toHaveLength(1);

    api.setAnswer(() => ({ items: [match(1)], nextCursor: null, loading: newest }));
    listeners.get(PUUID)?.onMatchesUpdated();
    await flushPromises();
    listeners.get(PUUID)?.onJoined(false);
    await flushPromises();
    expect(api.requests).toHaveLength(3);
  });
});
