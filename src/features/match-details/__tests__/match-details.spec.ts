import { describe, expect, it } from 'vitest';
import type { Match, MatchParticipant } from '@/shared/api';
import {
  isArena,
  matchSides,
  maxDamage,
  playerLink,
  sideTotals,
  viewedParticipant,
} from '../match-details';

const participant = (
  participantId: number,
  changes: Partial<MatchParticipant> = {},
): MatchParticipant => ({
  participantId,
  puuid: `puuid-${participantId}`,
  gameName: `Player ${participantId}`,
  tagLine: 'EUW',
  teamId: participantId <= 5 ? 100 : 200,
  subteamId: null,
  placement: null,
  championId: 103,
  champLevel: 16,
  role: null,
  kills: participantId,
  deaths: 1,
  assists: 2,
  damageToChampions: participantId * 1000,
  goldEarned: 10_000,
  cs: 150,
  visionScore: 20,
  items: [0, 0, 0, 0, 0, 0, 0],
  summonerSpells: [4, 14],
  runes: { primaryStyle: null, subStyle: null, perks: [], statPerks: [] },
  win: participantId > 5,
  ...changes,
});

const teamMatch = (changes: Partial<Match> = {}): Pick<Match, 'participants' | 'remake'> => ({
  remake: false,
  participants: Array.from({ length: 10 }, (_, index) => participant(index + 1)),
  ...changes,
});

// Arena duo n (1–8) holds participants 2n-1 and 2n; teamId splits top and bottom halves.
const arenaMatch = (placements: number[]): Pick<Match, 'participants' | 'remake'> => ({
  remake: false,
  participants: Array.from({ length: 16 }, (_, index) => {
    const duo = (index >> 1) + 1;
    const placement = placements[duo - 1]!;
    return participant(index + 1, {
      teamId: index < 8 ? 100 : 200,
      subteamId: duo,
      placement,
      win: placement <= 4,
    });
  }),
});

describe('matchSides', () => {
  it('puts blue side first, players in participant order', () => {
    const sides = matchSides(teamMatch());
    expect(sides.map((side) => side.teamId)).toEqual([100, 200]);
    expect(sides[0]!.players.map((player) => player.participantId)).toEqual([1, 2, 3, 4, 5]);
    expect(sides[1]!.players.map((player) => player.participantId)).toEqual([6, 7, 8, 9, 10]);
  });

  it('keeps blue first even when the red side is listed first', () => {
    const match = teamMatch();
    const sides = matchSides({ ...match, participants: [...match.participants].reverse() });
    expect(sides.map((side) => side.teamId)).toEqual([100, 200]);
  });

  it('reads each side result from its players', () => {
    expect(matchSides(teamMatch()).map((side) => side.result)).toEqual(['loss', 'win']);
  });

  it('marks both sides of a remake as a remake', () => {
    expect(matchSides(teamMatch({ remake: true })).map((side) => side.result)).toEqual([
      'remake',
      'remake',
    ]);
  });

  it('adds up kills, deaths, assists, gold and damage per side', () => {
    const [blue, red] = matchSides(teamMatch());
    expect(blue!.totals).toEqual({
      kills: 15,
      deaths: 5,
      assists: 10,
      goldEarned: 50_000,
      damageToChampions: 15_000,
    });
    expect(red!.totals.kills).toBe(40);
  });

  it('groups Arena players by duo, not by the top/bottom half teamId', () => {
    const sides = matchSides(arenaMatch([2, 5, 1, 8, 3, 7, 4, 6]));
    expect(sides).toHaveLength(8);
    expect(sides.every((side) => side.players.length === 2)).toBe(true);
  });

  it('orders Arena duos by placement and shows the placement', () => {
    const sides = matchSides(arenaMatch([2, 5, 1, 8, 3, 7, 4, 6]));
    expect(sides.map((side) => side.placement)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(sides.map((side) => side.id)).toEqual([3, 1, 5, 7, 2, 8, 6, 4]);
    expect(sides[0]!.players.map((player) => player.participantId)).toEqual([5, 6]);
    expect(sides.map((side) => side.result)).toEqual([
      'win',
      'win',
      'win',
      'win',
      'loss',
      'loss',
      'loss',
      'loss',
    ]);
  });

  it('puts Arena duos without a placement last', () => {
    const match = arenaMatch([2, 1, 3, 4, 5, 6, 7, 8]);
    const participants = match.participants.map((player) =>
      player.subteamId === 2 ? { ...player, placement: null } : player,
    );
    const sides = matchSides({ ...match, participants });
    expect(sides[sides.length - 1]!.id).toBe(2);
    expect(sides[0]!.placement).toBe(2);
  });
});

describe('isArena', () => {
  it('tells Arena from team modes by the duo subteams', () => {
    expect(isArena(teamMatch())).toBe(false);
    expect(isArena(arenaMatch([1, 2, 3, 4, 5, 6, 7, 8]))).toBe(true);
  });
});

describe('sideTotals', () => {
  it('is zero for no players', () => {
    expect(sideTotals([])).toEqual({
      kills: 0,
      deaths: 0,
      assists: 0,
      goldEarned: 0,
      damageToChampions: 0,
    });
  });
});

describe('maxDamage', () => {
  it('takes the highest damage in the match, zero without players', () => {
    expect(maxDamage(teamMatch())).toBe(10_000);
    expect(maxDamage({ participants: [] })).toBe(0);
  });
});

describe('viewedParticipant', () => {
  it('finds the player the match was opened for', () => {
    const match = teamMatch();
    expect(viewedParticipant(match, 'puuid-7')?.participantId).toBe(7);
    expect(viewedParticipant(match, 'someone-else')).toBeUndefined();
    expect(viewedParticipant(match, undefined)).toBeUndefined();
  });
});

describe('playerLink', () => {
  it('links to the profile by platform and Riot ID', () => {
    expect(playerLink('en', 'euw1', { gameName: 'Earl Grey', tagLine: 'EUW' })).toEqual({
      name: 'player',
      params: { locale: 'en', platform: 'euw1', riotId: 'Earl Grey-EUW' },
    });
  });

  it('has no link for bots or an unknown platform', () => {
    expect(playerLink('en', 'euw1', { gameName: null, tagLine: null })).toBeNull();
    expect(playerLink('en', 'euw1', { gameName: 'Rooibos', tagLine: null })).toBeNull();
    expect(playerLink('en', 'pbe1', { gameName: 'Rooibos', tagLine: 'EUW' })).toBeNull();
  });
});
