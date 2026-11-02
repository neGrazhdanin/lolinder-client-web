<script setup lang="ts">
import { ChevronRightIcon } from '@lucide/vue';
import { computed, useId } from 'vue';
import { useI18n } from 'vue-i18n';
import type { TimelineSkillEvent } from '@/shared/api';
import { MAX_LEVEL, maxOrder, SKILL_SLOTS, skillOrder } from './timeline';

const props = defineProps<{ skills: TimelineSkillEvent[]; participantId: number }>();

const { t } = useI18n();
const titleId = useId();

const order = computed(() => skillOrder(props.skills, props.participantId));
const priority = computed(() => maxOrder(order.value));
const levels = Array.from({ length: MAX_LEVEL }, (_, index) => index + 1);
</script>

<template>
  <section :aria-labelledby="titleId" class="flex min-w-0 flex-col gap-3">
    <header class="flex flex-wrap items-center justify-between gap-2">
      <h3 :id="titleId" class="text-sm font-semibold tracking-tight">
        {{ t('match.timeline.skills.title') }}
      </h3>
      <p v-if="priority.length" class="flex items-center gap-1.5 text-xs text-muted-foreground">
        {{ t('match.timeline.skills.maxOrder') }}
        <span class="flex items-center gap-0.5">
          <template v-for="(slot, index) in priority" :key="slot">
            <ChevronRightIcon v-if="index > 0" class="size-3" aria-hidden="true" />
            <span
              class="grid h-5 min-w-5 place-items-center rounded-[4px] bg-secondary px-1 font-mono text-[11px] font-semibold text-secondary-foreground"
            >
              {{ t(`match.timeline.skills.slots.${slot}`) }}
            </span>
          </template>
        </span>
      </p>
    </header>

    <p v-if="order.length === 0" class="text-sm text-muted-foreground">
      {{ t('match.timeline.skills.empty') }}
    </p>
    <table
      v-else
      class="skill-grid w-full table-fixed border-separate font-mono text-[10px] sm:text-[11px]"
    >
      <caption class="sr-only">
        {{
          t('match.timeline.skills.grid')
        }}
      </caption>
      <thead>
        <tr>
          <td class="w-5 sm:w-6" />
          <th
            v-for="level in levels"
            :key="level"
            scope="col"
            class="pb-0.5 text-center font-normal text-muted-foreground"
          >
            <span class="sr-only">{{ t('match.timeline.skills.cell', { level }) }}</span>
            <span aria-hidden="true">{{ level }}</span>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="slot in SKILL_SLOTS" :key="slot" :data-slot="slot">
          <th scope="row" class="text-left text-xs font-semibold">
            {{ t(`match.timeline.skills.slots.${slot}`) }}
          </th>
          <td v-for="level in levels" :key="level" class="p-0">
            <span
              :class="[
                'grid h-5 place-items-center rounded-[3px] sm:h-6',
                order[level - 1] === slot
                  ? slot === 4
                    ? 'bg-primary font-semibold text-primary-foreground'
                    : 'bg-secondary font-semibold text-secondary-foreground'
                  : 'bg-foreground/[0.05]',
              ]"
            >
              <template v-if="order[level - 1] === slot">{{ level }}</template>
            </span>
          </td>
        </tr>
      </tbody>
    </table>
  </section>
</template>

<style scoped>
.skill-grid {
  border-spacing: 2px;
  margin: -2px;
  width: calc(100% + 4px);
}
</style>
