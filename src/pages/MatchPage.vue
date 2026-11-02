<script setup lang="ts">
import { CloudOffIcon, SearchXIcon } from '@lucide/vue';
import { useTitle } from '@vueuse/core';
import { computed, nextTick, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import StatePanel from '@/components/StatePanel.vue';
import { Button } from '@/components/ui/button';
import { MatchDetails, MatchSkeleton, useMatch } from '@/features/match-details';
import { errorMessageKey } from '@/shared/api';
import { useFormat } from '@/shared/i18n/format';
import { queueName } from '@/shared/riot';

// Route params arrive as props: a page fading out keeps the props it was rendered with.
const props = defineProps<{ locale: string; matchId: string; player?: string }>();

const { t } = useI18n();
const format = useFormat();
const { match, error, isNotFound, retry } = useMatch(() => props.matchId);

// Arriving from a match card leaves focus on a link that is gone; the heading takes it.
const root = ref<HTMLElement>();
const settled = computed(() => !!match.value || !!error.value);
watch(
  settled,
  async (done) => {
    if (!done) return;
    await nextTick();
    const heading = root.value?.querySelector<HTMLElement>('h1');
    if (!heading) return;
    heading.tabIndex = -1;
    heading.focus({ preventScroll: true });
  },
  { immediate: true },
);

useTitle(
  computed(() => {
    if (!match.value) return t('app.name');
    return t('match.documentTitle', {
      queue: t(`player.matches.queues.${queueName(match.value.queueId)}`),
      date: format.date(new Date(match.value.startedAt)),
    });
  }),
);
</script>

<template>
  <div ref="root">
    <MatchDetails v-if="match" :match="match" :viewed-puuid="player" />

    <StatePanel
      v-else-if="isNotFound"
      heading="h1"
      :title="t('match.notFound.title')"
      :description="t('match.notFound.description')"
      class="py-6 sm:py-12"
    >
      <template #icon><SearchXIcon /></template>
      <Button as-child variant="outline">
        <RouterLink :to="{ name: 'home', params: { locale } }">{{ t('notFound.back') }}</RouterLink>
      </Button>
    </StatePanel>

    <StatePanel
      v-else-if="error"
      heading="h1"
      tone="error"
      :title="t('match.error.title')"
      :description="t(errorMessageKey(error))"
      class="py-6 sm:py-12"
    >
      <template #icon><CloudOffIcon /></template>
      <Button @click="retry">{{ t('player.error.retry') }}</Button>
    </StatePanel>

    <MatchSkeleton v-else :label="t('match.loading')" />
  </div>
</template>
