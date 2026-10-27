import type {
  MatchHistoryItem,
  MatchHistoryPage,
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
    266: ['Aatrox', 'the Darkin Blade'],
    64: ['Lee Sin', 'the Blind Monk'],
    222: ['Jinx', 'the Loose Cannon'],
    412: ['Thresh', 'the Chain Warden'],
  },
  ru: {
    103: ['Ари', 'Девятихвостая лиса'],
    517: ['Сайлас', 'Освобождённый'],
    61: ['Орианна', 'Заводная леди'],
    266: ['Атрокс', 'Клинок Даркинов'],
    64: ['Ли Син', 'Слепой монах'],
    222: ['Джинкс', 'Сорвиголова'],
    412: ['Треш', 'Тюремщик'],
  },
} as const;

const items = {
  en: {
    3089: "Rabadon's Deathcap",
    3020: "Sorcerer's Shoes",
    3157: "Zhonya's Hourglass",
    3340: 'Stealth Ward',
  },
  ru: {
    3089: 'Смертельная шляпа Рабадона',
    3020: 'Сапоги чародея',
    3157: 'Песочные часы Жони',
    3340: 'Тотем-невидимка',
  },
} as const;

const spells = {
  en: { 4: ['SummonerFlash', 'Flash'], 14: ['SummonerDot', 'Ignite'] },
  ru: { 4: ['SummonerFlash', 'Скачок'], 14: ['SummonerDot', 'Воспламенение'] },
} as const;

const runeNames = {
  en: { domination: 'Domination', electrocute: 'Electrocute', sorcery: 'Sorcery' },
  ru: { domination: 'Доминирование', electrocute: 'Казнь электричеством', sorcery: 'Колдовство' },
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
    items: Object.entries(items[locale]).map(([id, name]) => ({
      id: Number(id),
      name,
      plaintext: '',
      gold: 0,
      image: `${id}.png`,
      tags: [],
      from: [],
      into: [],
    })),
    runeTrees: [
      {
        id: 8100,
        key: 'Domination',
        name: runeNames[locale].domination,
        icon: 'perk-images/Styles/7200_Domination.png',
        slots: [
          [
            {
              id: 8112,
              key: 'Electrocute',
              name: runeNames[locale].electrocute,
              icon: 'perk-images/Styles/Domination/Electrocute/Electrocute.png',
            },
          ],
        ],
      },
      {
        id: 8200,
        key: 'Sorcery',
        name: runeNames[locale].sorcery,
        icon: 'perk-images/Styles/7202_Sorcery.png',
        slots: [],
      },
    ],
    summonerSpells: Object.entries(spells[locale]).map(([id, [key, name]]) => ({
      id: Number(id),
      key,
      name,
      image: `${key}.png`,
    })),
  };
}

const HOUR = 60 * 60_000;

const lineup = [
  { gameName: 'Chamomile', championId: 103 },
  { gameName: 'Rooibos', championId: 266 },
  { gameName: 'Earl Grey', championId: 64 },
  { gameName: 'Matcha', championId: 222 },
  { gameName: null, championId: 412 },
  { gameName: 'Sencha', championId: 517 },
  { gameName: 'Oolong', championId: 61 },
  { gameName: 'Darjeeling', championId: 266 },
  { gameName: 'Assam', championId: 222 },
  { gameName: 'Hojicha', championId: 412 },
];

export function historyMatch(
  index: number,
  changes: Partial<MatchHistoryItem> = {},
): MatchHistoryItem {
  return {
    matchId: `EUW1_${7_000_000_000 - index}`,
    queueId: 420,
    patch: '16.21',
    startedAt: new Date(Date.now() - (index + 1) * HOUR).toISOString(),
    durationSec: 1711 + index * 37,
    remake: false,
    teamId: 100,
    subteamId: null,
    placement: null,
    championId: 103,
    champLevel: 16,
    role: 'MIDDLE',
    kills: 7,
    deaths: index % 3,
    assists: 11,
    damageToChampions: 24_310,
    goldEarned: 12_940,
    cs: 201,
    visionScore: 24,
    items: [3020, 3089, 3157, 0, 0, 0, 3340],
    summonerSpells: [4, 14],
    runes: { primaryStyle: 8100, subStyle: 8200, perks: [8112], statPerks: [5008, 5008, 5001] },
    win: index % 2 === 0,
    participants: lineup.map((slot, position) => ({
      puuid: position === 0 ? PUUID : `e2e-player-${position}`.padEnd(78, '0'),
      gameName: slot.gameName,
      tagLine: slot.gameName ? 'EUW' : null,
      teamId: position < 5 ? 100 : 200,
      subteamId: null,
      championId: slot.championId,
    })),
    ...changes,
  };
}

export function arenaMatch(index: number, placement: number): MatchHistoryItem {
  const champions = [103, 266, 64, 222, 412, 517, 61];
  return historyMatch(index, {
    queueId: 1700,
    subteamId: 1,
    placement,
    win: placement <= 4,
    items: [3020, 3089, 3157, 0, 0, 0, 0],
    participants: Array.from({ length: 16 }, (_, position) => ({
      puuid: position === 0 ? PUUID : `e2e-arena-${position}`.padEnd(78, '0'),
      gameName: `Duo ${position}`,
      tagLine: 'EUW',
      teamId: position < 8 ? 100 : 200,
      subteamId: 1 + (position >> 1),
      championId: champions[position % champions.length]!,
    })),
  });
}

export const IDLE = { newest: false, older: false };

export function matchPage(
  from: number,
  count: number,
  nextCursor: string | null,
  changes: Partial<MatchHistoryItem> = {},
): MatchHistoryPage {
  return {
    items: Array.from({ length: count }, (_, offset) => historyMatch(from + offset, changes)),
    nextCursor,
    loading: IDLE,
  };
}
