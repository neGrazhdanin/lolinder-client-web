<script setup lang="ts">
import { ChartSplineIcon } from '@lucide/vue';
import { useElementSize } from '@vueuse/core';
import { computed, ref, useId, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import StatePanel from '@/components/StatePanel.vue';
import { Skeleton } from '@/components/ui/skeleton';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useFormat } from '@/shared/i18n/format';
import { ladderPoints, type RankedQueue } from '@/shared/riot';
import { buildLpChart, type ChartTick, type RankSnapshot, snapshotAt } from './lp-chart';
import { useRankName } from './useRankName';

const props = defineProps<{
  items: RankSnapshot[] | undefined;
  loading: boolean;
  ranked: boolean;
}>();
const queue = defineModel<RankedQueue>('queue', { required: true });

const { t } = useI18n();
const format = useFormat();
const rankName = useRankName();
const titleId = useId();
const hintId = useId();

const frame = ref<HTMLElement>();
const { width, height } = useElementSize(frame);
const box = computed(() => ({
  width: width.value,
  height: height.value,
  top: 14,
  right: 76,
  bottom: 24,
  left: 0,
}));

const chart = computed(() =>
  props.items ? buildLpChart(props.items, box.value, Date.now()) : null,
);
const current = computed(() => props.items?.[props.items.length - 1]);
const tracking = computed(() => chart.value?.points.length === 1);

const delta = computed(() => {
  const items = props.items ?? [];
  const first = items[0];
  const last = items[items.length - 1];
  if (!first || !last || items.length < 2) return null;
  return { lp: ladderPoints(last) - ladderPoints(first), since: new Date(first.takenAt) };
});

const active = ref<number | null>(null);
watch(
  () => props.items,
  () => (active.value = null),
);
const activePoint = computed(() =>
  active.value === null ? undefined : chart.value?.points[active.value],
);
const activeChange = computed(() => {
  if (active.value === null || !props.items) return null;
  const now = props.items[active.value];
  const before = props.items[active.value - 1];
  return now && before ? ladderPoints(now) - ladderPoints(before) : null;
});

function onPointer(event: PointerEvent): void {
  if (!chart.value) return;
  const bounds = (event.currentTarget as SVGElement).getBoundingClientRect();
  active.value = snapshotAt(chart.value.points, event.clientX - bounds.left);
}

// The tooltip is visual only; keyboard users hear the point they moved to instead.
const announcement = ref('');

function onKey(event: KeyboardEvent): void {
  const count = chart.value?.points.length ?? 0;
  if (!count) return;
  const step = { ArrowLeft: -1, ArrowRight: 1, Home: -count, End: count }[event.key];
  if (step === undefined) return;
  event.preventDefault();
  active.value = Math.min(count - 1, Math.max(0, (active.value ?? count - 1) + step));
  const point = activePoint.value?.snapshot;
  if (point) {
    announcement.value = t('player.lp.pointAnnouncement', {
      date: format.date(new Date(point.takenAt)),
      rank: rankName(point.tier, point.division),
      lp: format.integer(point.leaguePoints),
    });
  }
}

function tickLabel(tick: ChartTick): string {
  return tick.kind === 'division'
    ? rankName(tick.step.tier, tick.step.division)
    : `${format.integer(tick.leaguePoints)} ${t('player.rank.lp')}`;
}

const shortDate = (time: number) => format.date(new Date(time), { day: 'numeric', month: 'short' });
</script>

<template>
  <section
    :aria-labelledby="titleId"
    :data-tier="current?.tier ?? 'NONE'"
    class="rounded-xl bg-card p-5 text-card-foreground"
  >
    <header class="flex flex-wrap items-start justify-between gap-3">
      <div class="flex flex-col gap-0.5">
        <h2 :id="titleId" class="text-base font-semibold tracking-tight">
          {{ t('player.lp.title') }}
        </h2>
        <p v-if="delta" class="text-xs text-muted-foreground">
          <span
            class="font-mono font-medium"
            :class="delta.lp > 0 ? 'text-win' : delta.lp < 0 ? 'text-loss' : 'text-foreground'"
          >
            {{ t('player.lp.change', { change: format.signed(delta.lp) }) }}
          </span>
          {{
            t('player.lp.since', {
              date: format.date(delta.since, { day: 'numeric', month: 'long' }),
            })
          }}
        </p>
      </div>
      <ToggleGroup
        v-model="queue"
        type="single"
        size="sm"
        :spacing="0.5"
        :aria-label="t('player.lp.queue')"
        class="rounded-lg bg-muted p-1"
      >
        <ToggleGroupItem
          v-for="option in ['solo', 'flex'] as const"
          :key="option"
          :value="option"
          class="h-9 rounded-sm px-3 text-xs text-muted-foreground data-[state=on]:bg-brand-muted data-[state=on]:font-semibold data-[state=on]:text-brand-muted-foreground data-[state=on]:ring-1 data-[state=on]:ring-primary data-[state=on]:ring-inset sm:h-7 sm:px-2.5"
        >
          {{ t(`player.queuesShort.${option}`) }}
        </ToggleGroupItem>
      </ToggleGroup>
    </header>

    <div ref="frame" class="relative mt-4 h-48 sm:h-56">
      <Skeleton
        v-if="loading && !items"
        class="absolute inset-0 animate-shimmer rounded-lg skeleton-shimmer"
      />

      <StatePanel
        v-else-if="!chart && width > 0"
        heading="h3"
        :title="t('player.lp.empty')"
        :description="t(ranked ? 'player.lp.emptyHint' : 'player.lp.unranked')"
        class="absolute inset-0 justify-center"
      >
        <template #icon><ChartSplineIcon /></template>
      </StatePanel>

      <template v-else-if="chart">
        <svg
          :key="queue"
          :width="width"
          :height="height"
          class="overflow-visible transition-opacity outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          :class="loading && 'opacity-50'"
          tabindex="0"
          role="img"
          :aria-label="t('player.lp.chart', { queue: t(`player.queues.${queue}`) })"
          :aria-describedby="hintId"
          @pointermove="onPointer"
          @pointerleave="active = null"
          @focus="active = chart.points.length - 1"
          @blur="active = null"
          @keydown="onKey"
        >
          <g v-for="tick in chart.ticks" :key="tick.points">
            <line
              :x1="0"
              :x2="width - box.right"
              :y1="tick.y"
              :y2="tick.y"
              class="stroke-border"
              stroke-width="1"
            />
            <text
              :x="width - box.right + 10"
              :y="tick.y"
              dominant-baseline="central"
              class="fill-muted-foreground font-mono text-[11px]"
            >
              {{ tickLabel(tick) }}
            </text>
          </g>

          <!-- One snapshot is a starting point, not a trend: drawn dashed until the LP changes. -->
          <path
            :d="chart.line"
            class="fill-none stroke-tier-mark"
            :stroke-dasharray="tracking ? '4 5' : undefined"
            stroke-width="2"
            stroke-linejoin="round"
            stroke-linecap="round"
          />
          <circle
            v-if="tracking"
            :cx="chart.points[0]!.x"
            :cy="chart.points[0]!.y"
            r="4"
            class="fill-tier-mark stroke-card"
            stroke-width="2"
          />
          <circle
            v-else
            :cx="chart.end.x"
            :cy="chart.end.y"
            r="4"
            class="fill-tier-mark stroke-card"
            stroke-width="2"
          />

          <text :x="0" :y="height - 4" class="fill-muted-foreground font-mono text-[11px]">
            {{ shortDate(chart.start) }}
          </text>
          <text
            :x="width - box.right"
            :y="height - 4"
            text-anchor="end"
            class="fill-muted-foreground font-mono text-[11px]"
          >
            {{ shortDate(chart.stop) }}
          </text>

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
              class="fill-tier-mark stroke-card"
              stroke-width="2"
            />
          </g>
        </svg>

        <div
          v-if="activePoint"
          class="pointer-events-none absolute top-0 z-10 w-max max-w-56 rounded-lg border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md"
          :style="{
            left: `${Math.min(activePoint.x, width - box.right - 150)}px`,
            transform: activePoint.x > width / 2 ? 'translateX(-60%)' : 'translateX(8px)',
          }"
          aria-hidden="true"
        >
          <p class="font-mono text-[11px] text-muted-foreground">
            {{
              format.date(new Date(activePoint.snapshot.takenAt), {
                dateStyle: 'medium',
                timeStyle: 'short',
              })
            }}
          </p>
          <p class="mt-1 text-sm font-semibold">
            {{ format.integer(activePoint.snapshot.leaguePoints) }} {{ t('player.rank.lp') }}
            <span
              v-if="activeChange !== null"
              class="ml-1 font-mono text-xs font-medium"
              :class="
                activeChange > 0
                  ? 'text-win'
                  : activeChange < 0
                    ? 'text-loss'
                    : 'text-muted-foreground'
              "
            >
              {{ format.signed(activeChange) }}
            </span>
          </p>
          <p class="text-muted-foreground">
            {{ rankName(activePoint.snapshot.tier, activePoint.snapshot.division) }}
          </p>
        </div>

        <!-- sr-only on the table itself leaves its caption visible: captions render outside the table box. -->
        <div class="sr-only">
          <table>
            <caption>
              {{
                t('player.lp.table', { queue: t(`player.queues.${queue}`) })
              }}
            </caption>
            <thead>
              <tr>
                <th scope="col">{{ t('player.lp.date') }}</th>
                <th scope="col">{{ t('player.lp.rank') }}</th>
                <th scope="col">{{ t('player.rank.lp') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="point in chart.points" :key="point.time">
                <td>{{ format.date(new Date(point.snapshot.takenAt)) }}</td>
                <td>{{ rankName(point.snapshot.tier, point.snapshot.division) }}</td>
                <td>{{ format.integer(point.snapshot.leaguePoints) }}</td>
              </tr>
            </tbody>
          </table>
          <p :id="hintId">{{ t('player.lp.keyboardHint') }}</p>
          <p aria-live="polite">{{ announcement }}</p>
        </div>
      </template>
    </div>

    <p v-if="tracking && current" class="mt-3 text-xs text-muted-foreground">
      {{
        t('player.lp.tracking', {
          date: format.date(new Date(current.takenAt), { day: 'numeric', month: 'long' }),
        })
      }}
    </p>
  </section>
</template>
