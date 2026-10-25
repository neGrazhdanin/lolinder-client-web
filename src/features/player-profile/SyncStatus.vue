<script setup lang="ts">
import { useIntervalFn, useNow } from '@vueuse/core';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import ActivityBars from '@/components/ActivityBars.vue';
import type { PlayerSync } from '@/shared/api';
import { useFormat } from '@/shared/i18n/format';
import { syncState } from './sync';

const props = defineProps<{ sync: PlayerSync }>();

const { t } = useI18n();
const format = useFormat();
const now = useNow({ scheduler: (tick) => useIntervalFn(tick, 30_000) });

const state = computed(() => syncState(props.sync));
const lastSynced = computed(() =>
  props.sync.lastSyncedAt ? new Date(props.sync.lastSyncedAt) : null,
);
const busy = computed(() => state.value === 'syncing' || state.value === 'first-sync');
</script>

<template>
  <Transition
    mode="out-in"
    enter-from-class="opacity-0 translate-y-1"
    leave-to-class="opacity-0 -translate-y-1"
    enter-active-class="transition duration-200 ease-out"
    leave-active-class="transition duration-150 ease-in"
  >
    <span
      v-if="busy"
      key="busy"
      class="inline-flex items-center gap-2 font-medium text-foreground"
      data-sync="syncing"
    >
      <ActivityBars />
      {{ t(state === 'first-sync' ? 'player.sync.firstSync' : 'player.sync.syncing') }}
    </span>
    <span v-else-if="lastSynced" key="idle" :data-sync="state">
      <i18n-t keypath="player.sync.updated" scope="global">
        <template #time>
          <time
            :datetime="sync.lastSyncedAt ?? undefined"
            :title="format.date(lastSynced, { dateStyle: 'medium', timeStyle: 'short' })"
          >
            {{ format.relative(lastSynced, now) }}
          </time>
        </template>
      </i18n-t>
    </span>
    <span v-else key="never" data-sync="never">{{ t('player.sync.never') }}</span>
  </Transition>
</template>
