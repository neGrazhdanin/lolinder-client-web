<script setup lang="ts">
import { CloudOffIcon } from '@lucide/vue';
import { useTitle } from '@vueuse/core';
import { computed, nextTick, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import StatePanel from '@/components/StatePanel.vue';
import { Button } from '@/components/ui/button';
import { PlayerProfile, ProfileHeader, ProfileSkeleton } from '@/features/player-profile';
import { PlayerNotFound, usePlayerLookup, usePlayerSearchStore } from '@/features/player-search';
import { errorMessageKey, Platform } from '@/shared/api';
import {
  formatRiotId,
  isPlatform,
  PLATFORM_CODES,
  riotIdFromSlug,
  riotIdToSlug,
} from '@/shared/riot';

// Route params arrive as props: a page fading out keeps the props it was rendered with,
// while useRoute() would already point at the next page.
const props = defineProps<{ locale: string; platform: string; riotId: string }>();

const router = useRouter();
const { t } = useI18n();
const store = usePlayerSearchStore();

const platform = computed(() => (isPlatform(props.platform) ? props.platform : Platform.EUW1));
const riotId = computed(() => riotIdFromSlug(props.riotId));
const target = computed(() =>
  riotId.value ? { platform: platform.value, riotId: riotId.value } : null,
);

const { player, error, isNotFound, stillLooking, retry } = usePlayerLookup(target);

watch(
  player,
  (found) => {
    if (!found) return;
    store.remember(found);
    const canonical = riotIdToSlug(found);
    if (props.riotId !== canonical || props.platform !== found.platform) {
      void router.replace({
        name: 'player',
        params: { locale: props.locale, platform: found.platform, riotId: canonical },
      });
    }
  },
  { immediate: true },
);

// After a search the result replaces the page under the user; moving focus to its heading
// is what tells keyboard and screen reader users that it arrived.
const root = ref<HTMLElement>();
const settled = computed(
  () => !target.value || isNotFound.value || !!error.value || !!player.value,
);
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

const lookingUp = computed(() =>
  target.value
    ? t('player.lookingUp', {
        riotId: formatRiotId(target.value.riotId),
        region: PLATFORM_CODES[target.value.platform],
      })
    : '',
);

useTitle(
  computed(() => {
    const shown = player.value ?? riotId.value;
    return shown ? t('player.documentTitle', { riotId: formatRiotId(shown) }) : t('app.name');
  }),
);
</script>

<template>
  <!-- One root element: swapping roots would replay the page transition on every state change. -->
  <div ref="root">
    <PlayerNotFound v-if="!target || isNotFound" :platform="platform" :riot-id="riotId" />

    <PlayerProfile v-else-if="player" :key="player.puuid" :puuid="player.puuid" :player="player" />

    <StatePanel
      v-else-if="error"
      heading="h1"
      tone="error"
      :title="t('player.error.title')"
      :description="t(errorMessageKey(error))"
      class="py-6 sm:py-12"
    >
      <template #icon><CloudOffIcon /></template>
      <Button @click="retry">{{ t('player.error.retry') }}</Button>
    </StatePanel>

    <div v-else class="flex flex-col gap-8">
      <ProfileHeader
        :player="{ ...target.riotId, platform: target.platform, profileIconId: null }"
        :looking-up="lookingUp"
        rank-pending
      />
      <Transition
        enter-from-class="opacity-0 -translate-y-1"
        enter-active-class="transition duration-300 ease-out"
      >
        <p v-if="stillLooking" class="-mt-4 text-sm text-muted-foreground" role="status">
          {{ t('player.stillLooking') }}
        </p>
      </Transition>
      <ProfileSkeleton :header="false" :label="lookingUp" />
    </div>
  </div>
</template>
