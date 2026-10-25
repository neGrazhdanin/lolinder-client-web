import type { PlayerRank } from '@/shared/api';
import { type LadderStep, ladderPoints, ladderSteps } from '@/shared/riot';

export type RankSnapshot = Pick<
  PlayerRank,
  'tier' | 'division' | 'leaguePoints' | 'wins' | 'losses'
> & { takenAt: string };

export interface ChartBox {
  width: number;
  height: number;
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface ChartPoint {
  x: number;
  y: number;
  time: number;
  points: number;
  snapshot: RankSnapshot;
}

export type ChartTick = { y: number; points: number } & (
  { kind: 'division'; step: LadderStep } | { kind: 'apex'; leaguePoints: number }
);

export interface LpChart {
  points: ChartPoint[];
  /** Step-after line: a snapshot is written only on change, so the rank holds until the next one. */
  line: string;
  ticks: ChartTick[];
  end: { x: number; y: number };
  start: number;
  stop: number;
}

const APEX_FLOOR = ladderPoints({ tier: 'MASTER', division: 'I', leaguePoints: 0 });
const DAY = 24 * 3600 * 1000;

function niceStep(range: number): number {
  return [25, 50, 100, 200, 250, 500, 1000, 2000].find((step) => range / step <= 4) ?? 5000;
}

export function buildLpChart(
  items: readonly RankSnapshot[],
  box: ChartBox,
  now: number,
): LpChart | null {
  if (items.length === 0 || box.width <= box.left + box.right) return null;

  const series = items.map((snapshot) => ({
    snapshot,
    time: new Date(snapshot.takenAt).getTime(),
    points: ladderPoints(snapshot),
  }));
  const first = series[0]!;
  const last = series[series.length - 1]!;

  const start = first.time;
  const stop = Math.max(now, last.time, start + DAY);
  const low = Math.min(...series.map((entry) => entry.points));
  const high = Math.max(...series.map((entry) => entry.points));
  const pad = Math.max(25, (high - low) * 0.18);
  const floor = Math.max(0, low - pad);
  const ceiling = high + pad;

  const innerWidth = box.width - box.left - box.right;
  const innerHeight = box.height - box.top - box.bottom;
  const x = (time: number) => box.left + ((time - start) / (stop - start)) * innerWidth;
  const y = (points: number) => box.top + (1 - (points - floor) / (ceiling - floor)) * innerHeight;

  const points = series.map((entry) => ({ ...entry, x: x(entry.time), y: y(entry.points) }));
  const endX = x(stop);
  const endY = y(last.points);

  const line = points
    .map((point, index) => (index === 0 ? `M${point.x},${point.y}` : `H${point.x}V${point.y}`))
    .concat(`H${endX}`)
    .join('');

  const ticks: ChartTick[] = ladderSteps(floor, ceiling).map((step) => ({
    kind: 'division',
    step,
    points: step.points,
    y: y(step.points),
  }));
  if (ceiling > APEX_FLOOR) {
    const from = Math.max(floor, APEX_FLOOR) - APEX_FLOOR;
    const to = ceiling - APEX_FLOOR;
    const step = niceStep(to - from);
    for (let lp = Math.ceil(from / step) * step; lp <= to; lp += step) {
      if (lp === 0) continue;
      ticks.push({
        kind: 'apex',
        leaguePoints: lp,
        points: APEX_FLOOR + lp,
        y: y(APEX_FLOOR + lp),
      });
    }
  }

  return { points, line, ticks, end: { x: endX, y: endY }, start, stop };
}

export function snapshotAt(points: readonly ChartPoint[], pointerX: number): number {
  let index = 0;
  for (let i = 0; i < points.length; i++) {
    if (points[i]!.x <= pointerX) index = i;
  }
  return index;
}
