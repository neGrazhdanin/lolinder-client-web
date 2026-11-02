import {
  abortableWait,
  ErrorCode,
  type ErrorResponse,
  type MatchTimeline,
  type MatchTimelinePending,
  matchesControllerTimeline,
  retryDelay,
  type TimelineItemEvent,
  type TimelineSkillEvent,
  type Wait,
} from '@/shared/api';

export interface TimelineResponse {
  status: number;
  data: MatchTimeline | MatchTimelinePending;
  retryAfter: string | null;
}

export type TimelineRequest = (matchId: string, signal?: AbortSignal) => Promise<TimelineResponse>;

export const MAX_TIMELINE_WAIT_MS = 30_000;

const timelineRequest: TimelineRequest = async (matchId, signal) => {
  const { data, response } = await matchesControllerTimeline({
    path: { matchId },
    signal,
    throwOnError: true,
  });
  return { status: response.status, data, retryAfter: response.headers.get('Retry-After') };
};

export interface FetchTimelineOptions {
  signal?: AbortSignal;
  request?: TimelineRequest;
  wait?: Wait;
  onPending?: () => void;
}

export async function fetchTimeline(
  matchId: string,
  options: FetchTimelineOptions = {},
): Promise<MatchTimeline> {
  const { signal, request = timelineRequest, wait = abortableWait, onPending } = options;
  let waited = 0;
  for (;;) {
    const response = await request(matchId, signal);
    if (response.status !== 202 && 'frameTimes' in response.data) return response.data;
    const delay = retryDelay(response.retryAfter);
    if (waited + delay > MAX_TIMELINE_WAIT_MS) {
      throw { code: ErrorCode.SERVICE_UNAVAILABLE } satisfies ErrorResponse;
    }
    onPending?.();
    await wait(delay, signal);
    waited += delay;
  }
}

export interface BuildEntry {
  itemId: number;
  kind: TimelineItemEvent['kind'];
  count: number;
}

export interface BuildStep {
  atSec: number;
  entries: BuildEntry[];
}

export const SHOP_VISIT_GAP_SEC = 30;

export function buildSteps(
  items: readonly TimelineItemEvent[],
  participantId: number,
  include: (itemId: number) => boolean = () => true,
): BuildStep[] {
  const steps: BuildStep[] = [];
  let lastAt = -Infinity;
  for (const event of items) {
    if (event.participantId !== participantId || !include(event.itemId)) continue;
    let step = steps[steps.length - 1];
    if (!step || event.atSec - lastAt > SHOP_VISIT_GAP_SEC) {
      step = { atSec: event.atSec, entries: [] };
      steps.push(step);
    }
    lastAt = event.atSec;
    const previous = step.entries[step.entries.length - 1];
    if (previous && previous.itemId === event.itemId && previous.kind === event.kind) {
      previous.count++;
    } else {
      step.entries.push({ itemId: event.itemId, kind: event.kind, count: 1 });
    }
  }
  return steps;
}

const CONSUMABLE_TAGS = ['Consumable', 'Trinket'];

export function isConsumable(tags: readonly string[] | undefined): boolean {
  return !!tags?.some((tag) => CONSUMABLE_TAGS.includes(tag));
}

export type SkillSlot = 1 | 2 | 3 | 4;
export const SKILL_SLOTS: readonly SkillSlot[] = [1, 2, 3, 4];
export const MAX_LEVEL = 18;

export function skillOrder(
  skills: readonly TimelineSkillEvent[],
  participantId: number,
): SkillSlot[] {
  return skills
    .filter(
      (event): event is TimelineSkillEvent & { slot: SkillSlot } =>
        event.participantId === participantId && event.slot >= 1 && event.slot <= 4,
    )
    .slice(0, MAX_LEVEL)
    .map((event) => event.slot);
}

const BASIC_MAX_RANK = 5;

/** Basic abilities in the order they were maxed; unfinished ones follow by points spent. */
export function maxOrder(order: readonly SkillSlot[]): SkillSlot[] {
  const basics: SkillSlot[] = [1, 2, 3];
  const finishedAt = (slot: SkillSlot) => {
    let points = 0;
    for (const [level, skilled] of order.entries()) {
      if (skilled === slot && ++points === BASIC_MAX_RANK) return level;
    }
    return Infinity;
  };
  const points = (slot: SkillSlot) => order.filter((skilled) => skilled === slot).length;
  return basics
    .filter((slot) => points(slot) > 0)
    .sort((a, b) => finishedAt(a) - finishedAt(b) || points(b) - points(a) || a - b);
}

export interface ChartBox {
  width: number;
  height: number;
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface GoldPoint {
  x: number;
  y: number;
  atSec: number;
  diff: number;
}

export interface GoldChart {
  points: GoldPoint[];
  line: string;
  area: string;
  zeroY: number;
  ticks: { y: number; gold: number }[];
  minutes: { x: number; minute: number }[];
}

const GOLD_STEPS = [500, 1000, 2000, 2500, 5000, 10_000, 20_000];

export function goldStep(maxAbs: number): number {
  return GOLD_STEPS.find((step) => maxAbs / step <= 2) ?? 50_000;
}

const MINUTE_STEPS = [2, 5, 10, 15, 20, 30];
const MIN_LABEL_GAP_PX = 56;

export function minuteStep(durationSec: number, width: number): number {
  const minutes = Math.max(1, durationSec / 60);
  return (
    MINUTE_STEPS.find(
      (step) => minutes / step <= 8 && (step / minutes) * width >= MIN_LABEL_GAP_PX,
    ) ?? 60
  );
}

export function buildGoldChart(
  frameTimes: readonly number[],
  goldDiff: readonly number[],
  box: ChartBox,
): GoldChart | null {
  const count = Math.min(frameTimes.length, goldDiff.length);
  const innerWidth = box.width - box.left - box.right;
  const innerHeight = box.height - box.top - box.bottom;
  if (count < 2 || innerWidth <= 0 || innerHeight <= 0) return null;

  const end = frameTimes[count - 1]!;
  const maxAbs = Math.max(...goldDiff.slice(0, count).map(Math.abs));
  const step = goldStep(maxAbs);
  const extent = Math.max(step, Math.ceil(maxAbs / step) * step);

  const x = (atSec: number) => box.left + (end > 0 ? (atSec / end) * innerWidth : 0);
  const y = (gold: number) => box.top + ((extent - gold) / (2 * extent)) * innerHeight;

  const points = Array.from({ length: count }, (_, index) => {
    const atSec = frameTimes[index]!;
    const diff = goldDiff[index]!;
    return { x: x(atSec), y: y(diff), atSec, diff };
  });
  const zeroY = y(0);
  const line = points.map((point, i) => `${i ? 'L' : 'M'}${point.x},${point.y}`).join('');
  const area = `${line}L${points[count - 1]!.x},${zeroY}L${points[0]!.x},${zeroY}Z`;

  const ticks = [];
  for (let gold = -extent; gold <= extent; gold += step) ticks.push({ y: y(gold), gold });

  const every = minuteStep(end, innerWidth);
  const minutes = [];
  for (let minute = 0; minute * 60 <= end; minute += every) {
    minutes.push({ x: x(minute * 60), minute });
  }

  return { points, line, area, zeroY, ticks, minutes };
}

export function nearestPoint(points: readonly GoldPoint[], pointerX: number): number {
  let best = 0;
  for (let i = 1; i < points.length; i++) {
    if (Math.abs(points[i]!.x - pointerX) < Math.abs(points[best]!.x - pointerX)) best = i;
  }
  return best;
}
