<script setup lang="ts">
import { CheckIcon, ChevronRightIcon } from '@lucide/vue';
import { computed, useId } from 'vue';
import { useI18n } from 'vue-i18n';
import GameIcon from '@/components/GameIcon.vue';
import GameTooltip from '@/components/GameTooltip.vue';
import { Toggle } from '@/components/ui/toggle';
import type { TimelineItemEvent } from '@/shared/api';
import { useFormat } from '@/shared/i18n/format';
import { cn } from '@/shared/lib/utils';
import { useStaticData } from '@/shared/static-data';
import { buildSteps, isConsumable } from './timeline';

const props = defineProps<{ items: TimelineItemEvent[]; participantId: number }>();
const showConsumables = defineModel<boolean>('showConsumables', { default: false });

const { t } = useI18n();
const format = useFormat();
const { lookup } = useStaticData();
const titleId = useId();

const steps = computed(() =>
  buildSteps(
    props.items,
    props.participantId,
    showConsumables.value ? undefined : (itemId) => !isConsumable(lookup.value?.item(itemId)?.tags),
  ),
);

const itemName = (id: number) =>
  lookup.value?.item(id)?.name ?? t('player.matches.unknownItem', { id });
</script>

<template>
  <section :aria-labelledby="titleId" class="flex min-w-0 flex-col gap-3">
    <header class="flex flex-wrap items-center justify-between gap-2">
      <h3 :id="titleId" class="text-sm font-semibold tracking-tight">
        {{ t('match.timeline.build.title') }}
      </h3>
      <Toggle
        v-model="showConsumables"
        size="sm"
        variant="outline"
        class="h-8 gap-1.5 px-2.5 text-xs text-muted-foreground aria-pressed:bg-brand-muted aria-pressed:text-brand-muted-foreground"
      >
        <CheckIcon v-if="showConsumables" class="size-3.5" aria-hidden="true" />
        {{ t('match.timeline.build.consumables') }}
      </Toggle>
    </header>

    <p v-if="steps.length === 0" class="text-sm text-muted-foreground">
      {{ t('match.timeline.build.empty') }}
    </p>
    <ol v-else class="flex flex-wrap items-start gap-x-1 gap-y-3">
      <li v-for="(step, index) in steps" :key="step.atSec" class="flex items-start gap-1">
        <ChevronRightIcon
          v-if="index > 0"
          class="mt-[26px] size-3.5 shrink-0 text-muted-foreground/60"
          aria-hidden="true"
        />
        <div class="flex flex-col gap-1">
          <time
            :datetime="`PT${step.atSec}S`"
            class="font-mono text-[11px] leading-4 text-muted-foreground tabular-nums"
          >
            <span class="sr-only">{{
              t('match.timeline.build.step', { time: format.clock(step.atSec) })
            }}</span>
            <span aria-hidden="true">{{ format.clock(step.atSec) }}</span>
          </time>
          <ul class="flex gap-0.5">
            <li
              v-for="(entry, slot) in step.entries"
              :key="slot"
              :data-kind="entry.kind"
              class="relative"
            >
              <GameTooltip :id="entry.itemId" kind="items" :name="itemName(entry.itemId)">
                <GameIcon
                  :native-title="false"
                  :src="lookup?.item(entry.itemId)?.iconUrl"
                  :label="
                    entry.kind === 'sell'
                      ? t('match.timeline.build.sold', { item: itemName(entry.itemId) })
                      : itemName(entry.itemId)
                  "
                  :pending="!lookup"
                  :class="
                    cn(
                      'size-8 rounded-[5px] sm:size-9',
                      entry.kind === 'sell' && 'opacity-45 grayscale',
                    )
                  "
                />
              </GameTooltip>
              <span
                v-if="entry.kind === 'sell'"
                class="pointer-events-none absolute inset-0 overflow-hidden rounded-[5px]"
                aria-hidden="true"
              >
                <span
                  class="absolute top-1/2 left-1/2 h-[2px] w-[140%] -translate-1/2 -rotate-45 bg-loss"
                />
              </span>
              <span
                v-if="entry.count > 1"
                class="absolute -right-1 -bottom-1 rounded-[4px] border bg-background px-0.5 font-mono text-[10px] leading-3.5 font-medium"
              >
                {{ t('match.timeline.build.count', { count: entry.count }) }}
              </span>
            </li>
          </ul>
        </div>
      </li>
    </ol>
  </section>
</template>
