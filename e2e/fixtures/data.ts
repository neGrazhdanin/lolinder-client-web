import type {
  Player,
  PlayerProfile,
  RankHistory,
  RankHistoryPoint,
  StaticDataBundle,
} from '../../src/shared/api/generated/types.gen';

export const VERSION = '16.21.1';

export const PUUID = 'e2e-chamomile'.padEnd(78, '0');

export const player: Player = {
  puuid: PUUID,
  gameName: 'Chamomile',
  tagLine: 'EUW',
  platform: 'euw1',
  profileIconId: 29,
  summonerLevel: 412,
  sync: { status: 'fresh', lastSyncedAt: new Date(Date.now() - 3 * 60_000).toISOString() },
};

export const profile: PlayerProfile = {
  ...player,
  ranks: [
    { queue: 'solo', tier: 'EMERALD', division: 'II', leaguePoints: 64, wins: 128, losses: 109 },
    { queue: 'flex', tier: 'GOLD', division: 'I', leaguePoints: 12, wins: 20, losses: 18 },
  ],
  topMasteries: [
    { championId: 103, level: 41, points: 512_300, lastPlayedAt: '2026-10-20T18:00:00.000Z' },
    { championId: 517, level: 29, points: 301_450, lastPlayedAt: '2026-10-11T18:00:00.000Z' },
    { championId: 61, level: 23, points: 240_010, lastPlayedAt: '2026-09-01T18:00:00.000Z' },
  ],
};

const DAY = 24 * 60 * 60_000;

export function rankHistory(queue: 'solo' | 'flex'): RankHistory {
  const points: Omit<RankHistoryPoint, 'takenAt'>[] =
    queue === 'solo'
      ? [
          { tier: 'EMERALD', division: 'III', leaguePoints: 80, wins: 120, losses: 104 },
          { tier: 'EMERALD', division: 'II', leaguePoints: 10, wins: 123, losses: 105 },
          { tier: 'EMERALD', division: 'II', leaguePoints: 64, wins: 128, losses: 109 },
        ]
      : [{ tier: 'GOLD', division: 'I', leaguePoints: 12, wins: 20, losses: 18 }];
  return {
    items: points.map((point, index) => ({
      ...point,
      takenAt: new Date(Date.now() - (points.length - index) * 3 * DAY).toISOString(),
    })),
  };
}

export function withSync(
  base: PlayerProfile,
  status: PlayerProfile['sync']['status'],
  changes: Partial<PlayerProfile> = {},
): PlayerProfile {
  return {
    ...base,
    ...changes,
    sync: { status, lastSyncedAt: base.sync.lastSyncedAt },
  };
}

const names = {
  en: {
    103: ['Ahri', 'the Nine-Tailed Fox'],
    517: ['Sylas', 'the Unshackled'],
    61: ['Orianna', 'the Lady of Clockwork'],
  },
  ru: {
    103: ['Ари', 'Девятихвостая лиса'],
    517: ['Сайлас', 'Освобождённый'],
    61: ['Орианна', 'Заводная леди'],
  },
} as const;

export function staticBundle(locale: 'en' | 'ru'): StaticDataBundle {
  return {
    version: VERSION,
    locale,
    champions: Object.entries(names[locale]).map(([id, [name, title]]) => ({
      id: Number(id),
      key: name,
      name,
      title,
      image: `${id}.png`,
    })),
    items: [],
    runeTrees: [],
    summonerSpells: [],
  };
}
