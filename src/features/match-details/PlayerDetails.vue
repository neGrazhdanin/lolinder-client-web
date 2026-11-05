<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import ActivityBars from '@/components/ActivityBars.vue';
import { Button } from '@/components/ui/button';
import type { MatchParticipant } from '@/shared/api';
import BuildOrder from './BuildOrder.vue';
import PlayerRunes from './PlayerRunes.vue';
import SkillOrder from './SkillOrder.vue';
import { useMatchTimeline } from './useMatchTimeline';

const props = defineProps<{ matchId: string; participant: MatchParticipant }>();

const { t } = useI18n();
const { timeline, error, preparing, isUnavailable, retry } = useMatchTimeline(() => props.matchId);
const showConsumables = ref(false);
</script>

<template>
  <div class="flex flex-col gap-6 lg:flex-row lg:gap-10">
    <PlayerRunes :runes="participant.runes" class="shrink-0" />

    <div class="flex min-w-0 flex-1 flex-col gap-6 lg:border-l lg:pl-10">
      <template v-if="timeline">
        <BuildOrder
          v-model:show-consumables="showConsumables"
          :items="timeline.items"
          :participant-id="participant.participantId"
        />
        <SkillOrder
          :skills="timeline.skills"
          :participant-id="participant.participantId"
          class="max-w-[30rem]"
        />
      </template>
      <p v-else-if="isUnavailable" class="text-sm text-muted-foreground">
        {{ t('match.timeline.unavailable.title') }}
      </p>
      <p v-else-if="error" class="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
        {{ t('match.timeline.error') }}
        <Button variant="outline" size="sm" @click="retry">{{ t('player.error.retry') }}</Button>
      </p>
      <p v-else class="inline-flex items-center gap-2 text-xs text-muted-foreground" role="status">
        <ActivityBars />
        {{ t(preparing ? 'match.timeline.preparing' : 'match.timeline.loading') }}
      </p>
    </div>
  </div>
</template>
