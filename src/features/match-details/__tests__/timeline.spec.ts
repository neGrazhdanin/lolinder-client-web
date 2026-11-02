import { describe, expect, it, vi } from 'vitest';
import type { MatchTimeline, TimelineItemEvent, TimelineSkillEvent } from '@/shared/api';
import {
  buildGoldChart,
  buildSteps,
  fetchTimeline,
  goldStep,
  isConsumable,
  MAX_TIMELINE_WAIT_MS,
  maxOrder,
  minuteStep,
  nearestPoint,
  skillOrder,
  type TimelineRequest,
  type TimelineResponse,
} from '../timeline';

const timeline: MatchTimeline = {
  matchId: 'EUW1_1',
  frameTimes: [0, 60, 120],
  participants: [],
  goldDiff: [0, 150, -300],
  items: [],
  skills: [],
};
const ready: TimelineResponse = { status: 200, data: timeline, retryAfter: null };
const pending = (retryAfter: string | null = '2'): TimelineResponse => ({
  status: 202,
  data: { status: 'pending' },
  retryAfter,
});

function requestSequence(...responses: TimelineResponse[]) {
  const request = vi.fn<TimelineRequest>();
  for (const response of responses) request.mockResolvedValueOnce(response);
  return request;
}

describe('fetchTimeline', () => {
  it('returns a timeline that is ready', async () => {
    const wait = vi.fn<(ms: number) => Promise<void>>(async () => {});
    await expect(fetchTimeline('EUW1_1', { request: requestSequence(ready), wait })).resolves.toBe(
      timeline,
    );
    expect(wait).not.toHaveBeenCalled();
  });

  it('asks again after Retry-After while the API answers 202', async () => {
    const request = requestSequence(pending('2'), pending('3'), ready);
    const wait = vi.fn<(ms: number) => Promise<void>>(async () => {});
    const onPending = vi.fn<() => void>();

    await expect(fetchTimeline('EUW1_1', { request, wait, onPending })).resolves.toBe(timeline);
    expect(request).toHaveBeenCalledTimes(3);
    expect(request).toHaveBeenCalledWith('EUW1_1', undefined);
    expect(wait.mock.calls.map(([ms]) => ms)).toEqual([2000, 3000]);
    expect(onPending).toHaveBeenCalledTimes(2);
  });

  it('gives up with SERVICE_UNAVAILABLE once the waits add up past the limit', async () => {
    const request = vi.fn<TimelineRequest>().mockResolvedValue(pending('2'));
    const wait = vi.fn<(ms: number) => Promise<void>>(async () => {});

    await expect(fetchTimeline('EUW1_1', { request, wait })).rejects.toEqual({
      code: 'SERVICE_UNAVAILABLE',
    });
    const waited = wait.mock.calls.reduce((sum, [ms]) => sum + ms, 0);
    expect(waited).toBeLessThanOrEqual(MAX_TIMELINE_WAIT_MS);
    expect(waited).toBeGreaterThan(MAX_TIMELINE_WAIT_MS - 2000);
  });

  it('lets API errors such as TIMELINE_UNAVAILABLE through untouched', async () => {
    const request = vi.fn<TimelineRequest>().mockRejectedValue({ code: 'TIMELINE_UNAVAILABLE' });
    await expect(fetchTimeline('EUW1_1', { request })).rejects.toEqual({
      code: 'TIMELINE_UNAVAILABLE',
    });
  });

  it('stops waiting when the query is cancelled', async () => {
    const controller = new AbortController();
    const request = vi.fn<TimelineRequest>().mockResolvedValue(pending('2'));
    const result = fetchTimeline('EUW1_1', { request, signal: controller.signal });
    controller.abort(new Error('cancelled'));
    await expect(result).rejects.toThrow('cancelled');
    expect(request).toHaveBeenCalledTimes(1);
  });
});

const buy = (participantId: number, atSec: number, itemId: number): TimelineItemEvent => ({
  participantId,
  atSec,
  itemId,
  kind: 'buy',
});

describe('buildSteps', () => {
  const items: TimelineItemEvent[] = [
    buy(1, 3, 1055),
    buy(1, 4, 2003),
    buy(2, 4, 1056),
    buy(1, 5, 2003),
    buy(1, 521, 3133),
    buy(1, 523, 1036),
    { participantId: 1, atSec: 1200, itemId: 1055, kind: 'sell' },
    buy(1, 1201, 3031),
  ];

  it('groups one participant purchases by shop visit, labelled with the first one', () => {
    const steps = buildSteps(items, 1);
    expect(steps.map((step) => step.atSec)).toEqual([3, 521, 1200]);
    expect(steps[1]!.entries.map((entry) => entry.itemId)).toEqual([3133, 1036]);
  });

  it('stacks the same item bought in a row', () => {
    expect(buildSteps(items, 1)[0]!.entries).toEqual([
      { itemId: 1055, kind: 'buy', count: 1 },
      { itemId: 2003, kind: 'buy', count: 2 },
    ]);
  });

  it('keeps sales in place, apart from purchases of the same item', () => {
    expect(buildSteps(items, 1)[2]!.entries).toEqual([
      { itemId: 1055, kind: 'sell', count: 1 },
      { itemId: 3031, kind: 'buy', count: 1 },
    ]);
  });

  it('starts a new visit after a gap of more than half a minute', () => {
    const steps = buildSteps([buy(1, 100, 1001), buy(1, 130, 1001), buy(1, 161, 1001)], 1);
    expect(steps.map((step) => step.atSec)).toEqual([100, 161]);
    expect(steps[0]!.entries[0]!.count).toBe(2);
  });

  it('drops filtered items and the visits left empty', () => {
    const steps = buildSteps(items, 1, (itemId) => itemId !== 2003 && itemId !== 1055);
    expect(steps.map((step) => step.atSec)).toEqual([521, 1201]);
  });
});

describe('isConsumable', () => {
  it('treats potions, wards and trinkets as consumables', () => {
    expect(isConsumable(['Consumable', 'Vision'])).toBe(true);
    expect(isConsumable(['Trinket', 'Vision'])).toBe(true);
    expect(isConsumable(['SpellDamage'])).toBe(false);
    expect(isConsumable(undefined)).toBe(false);
  });
});

const skill = (participantId: number, slot: number): TimelineSkillEvent => ({
  participantId,
  atSec: 0,
  slot,
});

describe('skillOrder', () => {
  it('lists one participant skills by level and stops at 18', () => {
    const skills = [
      skill(1, 1),
      skill(2, 3),
      skill(1, 3),
      ...Array.from({ length: 20 }, () => skill(1, 2)),
    ];
    const order = skillOrder(skills, 1);
    expect(order).toHaveLength(18);
    expect(order.slice(0, 3)).toEqual([1, 3, 2]);
  });

  it('ignores slots outside Q, W, E and R', () => {
    expect(skillOrder([skill(1, 0), skill(1, 4), skill(1, 5)], 1)).toEqual([4]);
  });
});

describe('maxOrder', () => {
  it('orders basic abilities by when they reached rank five', () => {
    // Q first, then E maxed before W
    const order = [1, 2, 3, 1, 1, 4, 1, 1, 3, 3, 4, 3, 3, 2, 2, 4, 2, 2] as const;
    expect(maxOrder([...order])).toEqual([1, 3, 2]);
  });

  it('ranks unfinished abilities by points, skipping untouched ones', () => {
    expect(maxOrder([1, 3, 1, 1])).toEqual([1, 3]);
  });
});

describe('gold chart scale', () => {
  const box = { width: 300, height: 120, top: 10, right: 40, bottom: 10, left: 0 };

  it('picks a round step that leaves two or fewer steps on each side', () => {
    expect(goldStep(300)).toBe(500);
    expect(goldStep(4800)).toBe(2500);
    expect(goldStep(12_000)).toBe(10_000);
  });

  it('marks minutes more sparsely in longer games and narrower charts', () => {
    expect(minuteStep(10 * 60, 600)).toBe(2);
    expect(minuteStep(31 * 60, 1000)).toBe(5);
    expect(minuteStep(52 * 60, 1000)).toBe(10);
    expect(minuteStep(31 * 60, 200)).toBe(10);
  });

  it('centres zero and spans the game end to end', () => {
    const chart = buildGoldChart([0, 60, 120], [0, 2000, -4000], box)!;
    expect(chart.zeroY).toBe(60);
    expect(chart.points.map((point) => point.x)).toEqual([0, 130, 260]);
    expect(chart.points[2]!.y).toBe(110);
    expect(chart.ticks.map((tick) => tick.gold)).toEqual([-4000, -2000, 0, 2000, 4000]);
    expect(chart.minutes.map((mark) => mark.minute)).toEqual([0, 2]);
    expect(chart.area.endsWith('L260,60L0,60Z')).toBe(true);
  });

  it('has nothing to draw without two frames or room', () => {
    expect(buildGoldChart([0], [0], box)).toBeNull();
    expect(buildGoldChart([0, 60], [0, 10], { ...box, width: 30 })).toBeNull();
  });

  it('finds the frame nearest to the pointer', () => {
    const chart = buildGoldChart([0, 60, 120], [0, 2000, -4000], box)!;
    expect(nearestPoint(chart.points, 70)).toBe(1);
    expect(nearestPoint(chart.points, 250)).toBe(2);
    expect(nearestPoint(chart.points, -20)).toBe(0);
  });
});
