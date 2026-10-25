import { describe, expect, it } from 'vitest';
import { buildLpChart, type RankSnapshot, snapshotAt } from '../lp-chart';

const box = { width: 400, height: 200, top: 0, right: 0, bottom: 0, left: 0 };
const day = 24 * 3600 * 1000;
const t0 = Date.UTC(2026, 9, 1);

const snapshot = (dayOffset: number, rank: Partial<RankSnapshot>): RankSnapshot => ({
  takenAt: new Date(t0 + dayOffset * day).toISOString(),
  tier: 'EMERALD',
  division: 'II',
  leaguePoints: 50,
  wins: 10,
  losses: 10,
  ...rank,
});

describe('buildLpChart', () => {
  it('returns null without data or room to draw', () => {
    expect(buildLpChart([], box, t0)).toBeNull();
    expect(buildLpChart([snapshot(0, {})], { ...box, width: 0 }, t0)).toBeNull();
  });

  it('draws a step line that holds each rank until the next snapshot and up to now', () => {
    const chart = buildLpChart(
      [snapshot(0, { leaguePoints: 20 }), snapshot(2, { leaguePoints: 80 })],
      box,
      t0 + 4 * day,
    )!;

    const [first, second] = chart.points;
    expect(first!.x).toBe(0);
    expect(second!.x).toBe(200);
    expect(second!.y).toBeLessThan(first!.y);
    expect(chart.line).toBe(`M0,${first!.y}H200V${second!.y}H400`);
    expect(chart.end).toEqual({ x: 400, y: second!.y });
  });

  it('labels the division floors crossed by a promotion', () => {
    const chart = buildLpChart(
      [snapshot(0, { leaguePoints: 90 }), snapshot(1, { division: 'I', leaguePoints: 10 })],
      box,
      t0 + 2 * day,
    )!;
    expect(chart.ticks.map((tick) => tick.kind === 'division' && tick.step.division)).toEqual([
      'I',
    ]);
  });

  it('uses LP ticks inside the apex pool', () => {
    const chart = buildLpChart(
      [
        snapshot(0, { tier: 'GRANDMASTER', division: 'I', leaguePoints: 2100 }),
        snapshot(3, { tier: 'GRANDMASTER', division: 'I', leaguePoints: 2315 }),
      ],
      box,
      t0 + 5 * day,
    )!;
    expect(chart.ticks.every((tick) => tick.kind === 'apex')).toBe(true);
    expect(chart.ticks.map((tick) => tick.kind === 'apex' && tick.leaguePoints)).toEqual([
      2100, 2200, 2300,
    ]);
  });

  it('gives a single snapshot at least a day of width', () => {
    const chart = buildLpChart([snapshot(0, {})], box, t0)!;
    expect(chart.stop - chart.start).toBe(day);
  });
});

describe('snapshotAt', () => {
  it('finds the snapshot in effect at a pointer position', () => {
    const chart = buildLpChart(
      [snapshot(0, {}), snapshot(2, { leaguePoints: 70 }), snapshot(3, { leaguePoints: 90 })],
      box,
      t0 + 4 * day,
    )!;
    expect(snapshotAt(chart.points, 10)).toBe(0);
    expect(snapshotAt(chart.points, 250)).toBe(1);
    expect(snapshotAt(chart.points, 399)).toBe(2);
  });
});
