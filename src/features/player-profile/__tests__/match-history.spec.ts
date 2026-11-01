import { describe, expect, it } from 'vitest';
import type { MatchHistoryItem, MatchHistoryPage } from '@/shared/api';
import {
  csPerMinute,
  kdaRatio,
  matchListState,
  matchResult,
  recentForm,
  teamsOf,
} from '../match-history';

const match = (id: number, changes: Partial<MatchHistoryItem> = {}): MatchHistoryItem => ({
  matchId: `EUW1_${id}`,
  queueId: 420,
  patch: '16.21',
  startedAt: '2026-10-25T12:00:00.000Z',
  durationSec: 1800,
  remake: false,
  teamId: 100,
  subteamId: null,
  placement: null,
  championId: 103,
  champLevel: 16,
  role: 'MIDDLE',
  kills: 7,
  deaths: 2,
  assists: 11,
  damageToChampions: 24_000,
  goldEarned: 13_000,
  cs: 210,
  visionScore: 24,
  items: [3089, 0, 0, 0, 0, 0, 3340],
  summonerSpells: [4, 14],
  runes: { primaryStyle: 8100, subStyle: 8300, perks: [8112], statPerks: [] },
  win: true,
  participants: [],
  ...changes,
});

const page = (
  items: MatchHistoryItem[],
  nextCursor: string | null,
  loading: Partial<MatchHistoryPage['loading']> = {},
): MatchHistoryPage => ({
  items,
  nextCursor,
  loading: { newest: false, older: false, ...loading },
});

describe('match stats', () => {
  it('computes the KDA ratio, with no finite ratio for a deathless game', () => {
    expect(kdaRatio({ kills: 7, deaths: 2, assists: 11 })).toBe(9);
    expect(kdaRatio({ kills: 3, deaths: 0, assists: 4 })).toBeNull();
  });

  it('computes CS per minute and survives a zero-length game', () => {
    expect(csPerMinute({ cs: 210, durationSec: 1800 })).toBe(7);
    expect(csPerMinute({ cs: 0, durationSec: 0 })).toBe(0);
  });

  it('reads a remake as neither win nor loss', () => {
    expect(matchResult({ win: true, remake: false })).toBe('win');
    expect(matchResult({ win: false, remake: false })).toBe('loss');
    expect(matchResult({ win: false, remake: true })).toBe('remake');
  });
});

describe('teamsOf', () => {
  const player = (puuid: string, teamId: number, subteamId: number | null = null) => ({
    puuid,
    gameName: puuid,
    tagLine: 'EUW',
    teamId,
    subteamId,
    championId: 1,
  });

  it('groups players by team in the order teams first appear', () => {
    const teams = teamsOf([player('a', 100), player('b', 200), player('c', 100)]);
    expect(teams.map((team) => team.map((p) => p.puuid))).toEqual([['a', 'c'], ['b']]);
  });

  it('groups Arena players by duo, not by the top/bottom half teamId', () => {
    const duos = Array.from({ length: 16 }, (_, index) =>
      player(`p${index}`, index < 8 ? 100 : 200, 1 + (index >> 1)),
    );
    const teams = teamsOf(duos);
    expect(teams).toHaveLength(8);
    expect(teams[0]?.map((p) => p.puuid)).toEqual(['p0', 'p1']);
  });
});

describe('recentForm', () => {
  it('counts wins and losses without remakes, newest game last', () => {
    const form = recentForm([
      match(3, { win: true }),
      match(2, { remake: true }),
      match(1, { win: false }),
    ]);
    expect(form).toEqual({ wins: 1, losses: 1, results: ['loss', 'win'] });
  });

  it('looks at the most recent games only', () => {
    const items = Array.from({ length: 30 }, (_, index) => match(index, { win: index < 5 }));
    expect(recentForm(items, 20)).toMatchObject({ wins: 5, losses: 15 });
  });
});

describe('matchListState', () => {
  it('is empty and idle before the first page', () => {
    expect(matchListState(undefined)).toMatchObject({
      items: [],
      awaitingFirst: false,
      hasMore: false,
      complete: false,
    });
  });

  it('waits for the first games on a player seen for the first time', () => {
    expect(matchListState([page([], null, { newest: true })])).toMatchObject({
      awaitingFirst: true,
      loadingMore: false,
      checkingNew: false,
    });
  });

  it('offers more while the last page has a cursor', () => {
    expect(matchListState([page([match(2), match(1)], 'c1')])).toMatchObject({
      hasMore: true,
      complete: false,
      loadingMore: false,
    });
  });

  it('shows a loading row when the last page waits for older games', () => {
    const state = matchListState([page([match(2)], 'c1'), page([], null, { older: true })]);
    expect(state).toMatchObject({ loadingMore: true, hasMore: false, checkingNew: false });
    expect(state.items).toHaveLength(1);
  });

  it('marks new games on the way while the newest are fetched', () => {
    expect(matchListState([page([match(1)], null, { newest: true })])).toMatchObject({
      checkingNew: true,
      loadingMore: false,
      complete: true,
    });
  });

  it('tells both ends apart on a single page', () => {
    expect(matchListState([page([match(1)], null, { newest: true, older: true })])).toMatchObject({
      checkingNew: true,
      loadingMore: true,
      complete: false,
    });
  });

  it('reports the end of the history only when no older games are loading', () => {
    expect(matchListState([page([match(1)], null)]).complete).toBe(true);
    expect(matchListState([page([match(1)], null, { older: true })]).complete).toBe(false);
    expect(matchListState([page([], null)]).complete).toBe(false);
  });

  it('lists a game once when shifted page boundaries repeat it', () => {
    const state = matchListState([
      page([match(3), match(2)], 'c2'),
      page([match(2), match(1)], null),
    ]);
    expect(state.items.map((item) => item.matchId)).toEqual(['EUW1_3', 'EUW1_2', 'EUW1_1']);
  });
});
