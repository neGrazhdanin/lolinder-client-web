<script setup lang="ts">
import { useElementSize } from '@vueuse/core';
import { computed, ref, useId } from 'vue';
import { useI18n } from 'vue-i18n';
import { useFormat } from '@/shared/i18n/format';
import { buildGoldChart, nearestPoint } from './timeline';

const props = defineProps<{
  frameTimes: number[];
  goldDiff: number[];
  teamGold: { blue: number; red: number }[];
}>();

const { t } = useI18n();
const format = useFormat();
const titleId = useId();
const hintId = useId();
const aboveId = useId();
const belowId = useId();

const frame = ref<HTMLElement>();
const { width, height } = useElementSize(frame);
const box = computed(() => ({
  width: width.value,
  height: height.value,
  top: 8,
  right: 52,
  bottom: 22,
  left: 0,
}));

const chart = computed(() => buildGoldChart(props.frameTimes, props.goldDiff, box.value));

const active = ref<number | null>(null);
const activePoint = computed(() =>
  active.value === null ? undefined : chart.value?.points[active.value],
);
const activeGold = computed(() =>
  active.value === null ? undefined : props.teamGold[active.value],
);

function onPointer(event: PointerEvent): void {
  if (!chart.value) return;
  const bounds = (event.currentTarget as SVGElement).getBoundingClientRect();
  active.value = nearestPoint(chart.value.points, event.clientX - bounds.left);
}

const announcement = ref('');

function describe(index: number): string {
  const diff = props.goldDiff[index] ?? 0;
  const time = format.clock(props.frameTimes[index] ?? 0);
  if (diff === 0) return t('match.timeline.gold.announceEven', { time });
  return t('match.timeline.gold.announceLead', {
    time,
    side: t(diff > 0 ? 'match.sides.blue' : 'match.sides.red'),
    gold: format.integer(Math.abs(diff)),
  });
}

function onKey(event: KeyboardEvent): void {
  const count = chart.value?.points.length ?? 0;
  if (!count) return;
  const step = { ArrowLeft: -1, ArrowRight: 1, Home: -count, End: count }[event.key];
  if (step === undefined) return;
  event.preventDefault();
  active.value = Math.min(count - 1, Math.max(0, (active.value ?? count - 1) + step));
  announcement.value = describe(active.value);
}

const tickLabel = (gold: number) => (gold === 0 ? '0' : format.compact(Math.abs(gold)));
const lead = (diff: number) =>
  diff > 0
    ? t('match.timeline.gold.blueAhead')
    : diff < 0
      ? t('match.timeline.gold.redAhead')
      : t('match.timeline.gold.even');
// Blue and red side take the win and loss hues: the palette's only blue and red that pass contrast.
const ink = (diff: number) =>
  diff > 0 ? 'text-win' : diff < 0 ? 'text-loss' : 'text-muted-foreground';
</script>

<template>
  <section :aria-labelledby="titleId" class="rounded-xl bg-card p-4 text-card-foreground sm:p-5">
    <header class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1.5">
      <h3 :id="titleId" class="text-sm font-semibold tracking-tight">
        {{ t('match.timeline.gold.title') }}
      </h3>
      <p class="flex items-center gap-3 text-xs text-muted-foreground" aria-hidden="true">
        <span class="inline-flex items-center gap-1.5">
          <span class="h-2 w-3 rounded-[3px] bg-win" />
          {{ t('match.timeline.gold.blueAhead') }}
        </span>
        <span class="inline-flex items-center gap-1.5">
          <span class="h-2 w-3 rounded-[3px] bg-loss" />
          {{ t('match.timeline.gold.redAhead') }}
        </span>
      </p>
    </header>

    <div ref="frame" class="relative mt-3 h-44 sm:h-56">
      <template v-if="chart">
        <svg
          :width="width"
          :height="height"
          class="overflow-visible outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          tabindex="0"
          role="img"
          :aria-label="t('match.timeline.gold.chart')"
          :aria-describedby="hintId"
          @pointermove="onPointer"
          @pointerdown="onPointer"
          @pointerleave="active = null"
          @focus="active = chart.points.length - 1"
          @blur="active = null"
          @keydown="onKey"
        >
          <defs>
            <clipPath :id="aboveId">
              <rect x="0" y="0" :width="width" :height="chart.zeroY" />
            </clipPath>
            <clipPath :id="belowId">
              <rect x="0" :y="chart.zeroY" :width="width" :height="height - chart.zeroY" />
            </clipPath>
          </defs>

          <g v-for="tick in chart.ticks" :key="tick.gold">
            <line
              :x1="0"
              :x2="width - box.right"
              :y1="tick.y"
              :y2="tick.y"
              :class="tick.gold === 0 ? 'stroke-muted-foreground/50' : 'stroke-border'"
              stroke-width="1"
              :stroke-dasharray="tick.gold === 0 ? undefined : '2 4'"
            />
            <text
              :x="width - box.right + 8"
              :y="tick.y"
              dominant-baseline="central"
              :class="[
                'font-mono text-[11px]',
                tick.gold > 0 ? 'fill-win' : tick.gold < 0 ? 'fill-loss' : 'fill-muted-foreground',
              ]"
            >
              {{ tickLabel(tick.gold) }}
            </text>
          </g>

          <text
            v-for="mark in chart.minutes"
            :key="mark.minute"
            :x="mark.x"
            :y="height - 4"
            :text-anchor="mark.minute === 0 ? 'start' : 'middle'"
            class="fill-muted-foreground font-mono text-[11px]"
          >
            {{ format.clock(mark.minute * 60) }}
          </text>

          <g :clip-path="`url(#${aboveId})`">
            <path :d="chart.area" class="fill-win/15" />
            <path
              :d="chart.line"
              class="fill-none stroke-win"
              stroke-width="2"
              stroke-linejoin="round"
            />
          </g>
          <g :clip-path="`url(#${belowId})`">
            <path :d="chart.area" class="fill-loss/15" />
            <path
              :d="chart.line"
              class="fill-none stroke-loss"
              stroke-width="2"
              stroke-linejoin="round"
            />
          </g>

          <g v-if="activePoint">
            <line
              :x1="activePoint.x"
              :x2="activePoint.x"
              :y1="box.top"
              :y2="height - box.bottom"
              class="stroke-foreground/30"
              stroke-width="1"
            />
            <circle
              :cx="activePoint.x"
              :cy="activePoint.y"
              r="4"
              :class="[
                'stroke-card',
                activePoint.diff > 0
                  ? 'fill-win'
                  : activePoint.diff < 0
                    ? 'fill-loss'
                    : 'fill-muted-foreground',
              ]"
              stroke-width="2"
            />
          </g>
        </svg>

        <div
          v-if="activePoint && activeGold"
          class="pointer-events-none absolute top-0 z-10 w-max rounded-lg border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md"
          :style="{
            left: `${activePoint.x}px`,
            transform:
              activePoint.x > width / 2 ? 'translateX(calc(-100% - 12px))' : 'translateX(12px)',
          }"
          aria-hidden="true"
        >
          <p class="font-mono text-[11px] text-muted-foreground">
            {{ format.clock(activePoint.atSec) }}
          </p>
          <p :class="['mt-0.5 text-sm font-semibold', ink(activePoint.diff)]">
            {{ lead(activePoint.diff) }}
            <span v-if="activePoint.diff !== 0" class="ml-1 font-mono">
              {{
                t('match.timeline.gold.lead', { gold: format.integer(Math.abs(activePoint.diff)) })
              }}
            </span>
          </p>
          <dl class="mt-1.5 grid grid-cols-[auto_auto] gap-x-3 gap-y-0.5">
            <dt class="text-muted-foreground">{{ t('match.sides.blue') }}</dt>
            <dd class="text-right font-mono tabular-nums">{{ format.integer(activeGold.blue) }}</dd>
            <dt class="text-muted-foreground">{{ t('match.sides.red') }}</dt>
            <dd class="text-right font-mono tabular-nums">{{ format.integer(activeGold.red) }}</dd>
          </dl>
        </div>

        <div class="sr-only">
          <table>
            <caption>
              {{
                t('match.timeline.gold.table')
              }}
            </caption>
            <thead>
              <tr>
                <th scope="col">{{ t('match.timeline.gold.time') }}</th>
                <th scope="col">{{ t('match.sides.blue') }}</th>
                <th scope="col">{{ t('match.sides.red') }}</th>
                <th scope="col">{{ t('match.timeline.gold.difference') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(point, index) in chart.points" :key="point.atSec">
                <td>{{ format.clock(point.atSec) }}</td>
                <td>{{ format.integer(teamGold[index]?.blue ?? 0) }}</td>
                <td>{{ format.integer(teamGold[index]?.red ?? 0) }}</td>
                <td>{{ format.signed(point.diff) }}</td>
              </tr>
            </tbody>
          </table>
          <p :id="hintId">{{ t('match.timeline.gold.keyboardHint') }}</p>
          <p aria-live="polite">{{ announcement }}</p>
        </div>
      </template>
    </div>
  </section>
</template>
