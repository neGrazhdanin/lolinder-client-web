import { describe, expect, it } from 'vitest';
import { headlineRank, ladderPoints, ladderSteps, nextStep, winRate } from '../rank';

describe('ladderPoints', () => {
  it('orders divisions and tiers on one scale', () => {
    const silverOne = ladderPoints({ tier: 'SILVER', division: 'I', leaguePoints: 99 });
    const goldFour = ladderPoints({ tier: 'GOLD', division: 'IV', leaguePoints: 0 });
    expect(goldFour - silverOne).toBe(1);
    expect(ladderPoints({ tier: 'IRON', division: 'IV', leaguePoints: 0 })).toBe(0);
  });

  it('puts every apex tier on the shared Master LP pool', () => {
    expect(ladderPoints({ tier: 'MASTER', division: 'I', leaguePoints: 0 })).toBe(2800);
    expect(ladderPoints({ tier: 'GRANDMASTER', division: 'I', leaguePoints: 2315 })).toBe(5115);
    expect(ladderPoints({ tier: 'CHALLENGER', division: 'I', leaguePoints: 1200 })).toBe(4000);
  });
});

describe('ladderSteps', () => {
  it('lists division floors inside the range, bottom first', () => {
    expect(ladderSteps(2050, 2320)).toEqual([
      { points: 2100, tier: 'EMERALD', division: 'III' },
      { points: 2200, tier: 'EMERALD', division: 'II' },
      { points: 2300, tier: 'EMERALD', division: 'I' },
    ]);
  });

  it('stops at the Master floor', () => {
    expect(ladderSteps(2650, 5000)).toEqual([
      { points: 2700, tier: 'DIAMOND', division: 'I' },
      { points: 2800, tier: 'MASTER', division: null },
    ]);
  });

  it('is empty when the range sits inside the apex pool', () => {
    expect(ladderSteps(4000, 5000)).toEqual([]);
  });
});

describe('nextStep', () => {
  it('climbs a division inside a tier', () => {
    expect(nextStep({ tier: 'EMERALD', division: 'II' })).toEqual({
      tier: 'EMERALD',
      division: 'I',
    });
  });

  it('moves to the next tier from division I', () => {
    expect(nextStep({ tier: 'GOLD', division: 'I' })).toEqual({ tier: 'PLATINUM', division: 'IV' });
    expect(nextStep({ tier: 'DIAMOND', division: 'I' })).toEqual({
      tier: 'MASTER',
      division: null,
    });
  });

  it('has no next step in apex tiers', () => {
    expect(nextStep({ tier: 'GRANDMASTER', division: 'I' })).toBeNull();
  });
});

describe('winRate', () => {
  it('is the share of games won', () => {
    expect(winRate(441, 326)).toBeCloseTo(0.575, 3);
  });

  it('is null before the first game', () => {
    expect(winRate(0, 0)).toBeNull();
  });
});

describe('headlineRank', () => {
  it('prefers Solo/Duo and falls back to Flex', () => {
    expect(headlineRank([{ queue: 'flex' }, { queue: 'solo' }])).toEqual({ queue: 'solo' });
    expect(headlineRank([{ queue: 'flex' }])).toEqual({ queue: 'flex' });
    expect(headlineRank([])).toBeNull();
  });
});
