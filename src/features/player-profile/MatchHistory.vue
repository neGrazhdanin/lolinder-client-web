<script setup lang="ts">
import { CloudOffIcon, HistoryIcon, LoaderCircleIcon } from '@lucide/vue';
import { computed, useId } from 'vue';
import { useI18n } from 'vue-i18n';
import ActivityBars from '@/components/ActivityBars.vue';
import StatePanel from '@/components/StatePanel.vue';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { errorMessageKey } from '@/shared/api';
import { useFormat } from '@/shared/i18n/format';
import { MATCH_QUEUES, type MatchQueue } from '@/shared/riot';
import MatchCard from './MatchCard.vue';
import { type MatchListState, recentForm } from './match-history';

const props = defineProps<{
  puuid: string;
  state: MatchListState;
  pending: boolean;
  stale: boolean;
  error: unknown;
  loadingMore: boolean;
  loadMoreFailed: boolean;
}>();
const queue = defineModel<MatchQueue | undefined>('queue');
const emit = defineEmits<{ loadMore: []; retry: [] }>();

const { t } = useI18n();
const format = useFormat();
const titleId = useId();

const filter = computed<MatchQueue | 'all'>({
  get: () => queue.value ?? 'all',
  // A single-select toggle group emits undefined when its active item is clicked again.
  set: (value: MatchQueue | 'all' | undefined) => {
    if (value) queue.value = value === 'all' ? undefined : value;
  },
});

const form = computed(() => recentForm(props.state.items));
const showForm = computed(() => form.value.results.length >= 3 && !props.stale);

const skeleton = computed(() => (props.pending || props.state.awaitingFirst) && !props.error);
const failed = computed(() => !!props.error && props.state.items.length === 0 && !props.stale);
const empty = computed(
  () => !skeleton.value && !failed.value && !props.pending && props.state.items.length === 0,
);

const RISE_STEP_MS = 35;
const RISE_MAX_STEPS = 8;
const PAGE_SIZE = 20;
const riseDelay = (index: number) =>
  `${Math.min(index % PAGE_SIZE, RISE_MAX_STEPS) * RISE_STEP_MS}ms`;

const shimmer = 'animate-shimmer skeleton-shimmer';
</script>

<template>
  <section :aria-labelledby="titleId" class="flex flex-col gap-4">
    <header class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div class="flex min-w-0 flex-col gap-1">
        <h2 :id="titleId" class="text-base font-semibold tracking-tight">
          {{ t('player.matches.title') }}
        </h2>
        <div class="flex min-h-5 flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          <p v-if="showForm" class="flex items-center gap-2.5 text-muted-foreground">
            <span class="sr-only">
              {{ t('player.matches.form.label', { wins: form.wins, losses: form.losses }) }}
            </span>
            <span class="flex h-3.5 items-end gap-[2px]" aria-hidden="true">
              <span
                v-for="(outcome, index) in form.results"
                :key="index"
                :class="[
                  'w-1 rounded-[1.5px]',
                  outcome === 'win' ? 'h-full bg-win' : 'h-1/2 bg-loss',
                ]"
              />
            </span>
            <span class="font-mono tabular-nums" aria-hidden="true">
              {{ t('player.matches.form.last', { count: form.results.length }) }}
              <span class="ml-1.5 font-medium text-win">
                {{ t('player.matches.form.wins', { count: form.wins }) }}
              </span>
              <span class="ml-1 font-medium text-loss">
                {{ t('player.matches.form.losses', { count: form.losses }) }}
              </span>
              <span class="ml-1.5 text-foreground">
                {{ format.percent(form.wins / form.results.length) }}
              </span>
            </span>
          </p>
          <p
            v-if="state.checkingNew && !skeleton"
            class="inline-flex items-center gap-2 text-muted-foreground"
            role="status"
          >
            <ActivityBars />
            {{ t('player.matches.checkingNew') }}
          </p>
        </div>
      </div>

      <ToggleGroup
        v-model="filter"
        type="single"
        size="sm"
        :spacing="0.5"
        :aria-label="t('player.matches.filter')"
        class="grid w-full grid-cols-3 rounded-lg bg-muted p-1 sm:flex sm:w-fit"
      >
        <ToggleGroupItem
          v-for="option in ['all', ...MATCH_QUEUES] as const"
          :key="option"
          :value="option"
          class="h-9 rounded-sm px-3 text-xs text-muted-foreground data-[state=on]:bg-brand-muted data-[state=on]:font-semibold data-[state=on]:text-brand-muted-foreground data-[state=on]:ring-1 data-[state=on]:ring-primary data-[state=on]:ring-inset sm:h-7 sm:px-2.5"
        >
          {{ t(`player.matches.filters.${option}`) }}
        </ToggleGroupItem>
      </ToggleGroup>
    </header>

    <div v-if="skeleton" class="flex flex-col gap-2">
      <p
        :class="
          state.awaitingFirst
            ? 'inline-flex items-center gap-2 text-sm text-muted-foreground'
            : 'sr-only'
        "
        role="status"
      >
        <ActivityBars v-if="state.awaitingFirst" />
        {{ t('player.matches.loading') }}
      </p>
      <div
        v-for="row in 4"
        :key="row"
        class="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 rounded-xl bg-card p-3 sm:grid-cols-[7.5rem_auto_minmax(0,1fr)_auto] sm:gap-5 sm:p-4"
        aria-hidden="true"
      >
        <div class="col-span-3 flex flex-col gap-1.5 sm:col-span-1">
          <Skeleton :class="[shimmer, 'h-3.5 w-16']" />
          <Skeleton :class="[shimmer, 'h-3 w-24']" />
        </div>
        <div class="flex items-center gap-1.5">
          <Skeleton :class="[shimmer, 'size-11 rounded-lg sm:size-12']" />
          <div class="flex flex-col gap-0.5">
            <Skeleton :class="[shimmer, 'size-5 rounded-[4px]']" />
            <Skeleton :class="[shimmer, 'size-5 rounded-[4px]']" />
          </div>
        </div>
        <div class="flex flex-col gap-1.5">
          <Skeleton :class="[shimmer, 'h-4 w-20']" />
          <Skeleton :class="[shimmer, 'h-3 w-14']" />
        </div>
        <div class="hidden gap-0.5 sm:flex">
          <Skeleton v-for="slot in 7" :key="slot" :class="[shimmer, 'size-7 rounded-[5px]']" />
        </div>
      </div>
    </div>

    <StatePanel
      v-else-if="failed"
      tone="error"
      heading="h3"
      :title="t('player.matches.error')"
      :description="t(errorMessageKey(error))"
      class="rounded-xl bg-card p-5"
    >
      <template #icon><CloudOffIcon /></template>
      <Button variant="outline" @click="emit('retry')">{{ t('player.error.retry') }}</Button>
    </StatePanel>

    <StatePanel
      v-else-if="empty"
      heading="h3"
      :title="t(queue ? 'player.matches.emptyFiltered' : 'player.matches.empty')"
      :description="
        t(
          state.hasMore
            ? 'player.matches.emptyMore'
            : queue
              ? 'player.matches.emptyFilteredHint'
              : 'player.matches.emptyHint',
        )
      "
      class="rounded-xl bg-card p-5"
    >
      <template #icon><HistoryIcon /></template>
      <Button v-if="queue && !state.hasMore" variant="outline" @click="filter = 'all'">
        {{ t('player.matches.showAll') }}
      </Button>
    </StatePanel>

    <ol
      v-if="state.items.length"
      class="flex flex-col gap-2 transition-opacity duration-200"
      :class="stale && 'opacity-60'"
      :aria-busy="stale || undefined"
    >
      <li
        v-for="(match, index) in state.items"
        :key="match.matchId"
        class="@container animate-rise"
        :style="{ animationDelay: riseDelay(index) }"
      >
        <MatchCard :match="match" :puuid="puuid" />
      </li>
    </ol>

    <template v-if="!skeleton && !failed && !stale">
      <div
        v-if="error"
        class="flex flex-col items-start gap-3 rounded-xl border border-dashed px-4 py-3.5 text-sm sm:flex-row sm:items-center sm:justify-between"
        role="alert"
      >
        <p>
          <span class="font-medium">{{ t('player.matches.loadFailed') }}</span>
          <span class="text-muted-foreground"> {{ t(errorMessageKey(error)) }}</span>
        </p>
        <Button
          variant="outline"
          size="sm"
          @click="loadMoreFailed ? emit('loadMore') : emit('retry')"
        >
          {{ t('player.error.retry') }}
        </Button>
      </div>

      <p
        v-else-if="state.loadingMore"
        class="flex items-center justify-center gap-2.5 rounded-xl border border-dashed py-4 text-sm text-muted-foreground"
        role="status"
      >
        <ActivityBars />
        {{ t('player.matches.loadingOlder') }}
      </p>

      <Button
        v-else-if="state.hasMore"
        variant="outline"
        class="h-11 w-full gap-2 bg-card"
        :disabled="loadingMore"
        @click="emit('loadMore')"
      >
        <LoaderCircleIcon v-if="loadingMore" class="size-4 animate-spin" aria-hidden="true" />
        {{ t(loadingMore ? 'player.matches.loadingMore' : 'player.matches.loadMore') }}
      </Button>

      <p
        v-else-if="state.complete"
        class="flex items-center gap-3 py-2 text-xs text-muted-foreground before:h-px before:flex-1 before:bg-border after:h-px after:flex-1 after:bg-border"
      >
        {{ t('player.matches.end') }}
      </p>
    </template>
  </section>
</template>
