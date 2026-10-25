import { useLocalStorage } from '@vueuse/core';
import { defineStore } from 'pinia';
import { computed } from 'vue';
import type { Platform, Player } from '@/shared/api';
import { i18n } from '@/shared/i18n';
import { defaultPlatformFor, isPlatform } from '@/shared/riot';

export type RecentPlayer = Pick<
  Player,
  'puuid' | 'gameName' | 'tagLine' | 'platform' | 'profileIconId'
>;

const MAX_RECENT = 6;

function isRecentPlayer(value: unknown): value is RecentPlayer {
  const entry = value as Partial<RecentPlayer> | null;
  return (
    typeof entry?.puuid === 'string' &&
    typeof entry.gameName === 'string' &&
    typeof entry.tagLine === 'string' &&
    isPlatform(entry.platform) &&
    (entry.profileIconId === null || Number.isInteger(entry.profileIconId))
  );
}

export const usePlayerSearchStore = defineStore('player-search', () => {
  const savedPlatform = useLocalStorage<string | null>('lolinder-platform', null);
  const platform = computed<Platform>({
    get: () =>
      isPlatform(savedPlatform.value)
        ? savedPlatform.value
        : defaultPlatformFor(i18n.global.locale.value),
    set: (value) => (savedPlatform.value = value),
  });

  const stored = useLocalStorage<unknown[]>('lolinder-recent-players', []);
  const recent = computed(() =>
    (Array.isArray(stored.value) ? stored.value : []).filter(isRecentPlayer),
  );

  function remember(player: RecentPlayer): void {
    const { puuid, gameName, tagLine, platform, profileIconId } = player;
    stored.value = [
      { puuid, gameName, tagLine, platform, profileIconId },
      ...recent.value.filter((entry) => entry.puuid !== puuid),
    ].slice(0, MAX_RECENT);
  }

  function forget(puuid: string): void {
    stored.value = recent.value.filter((entry) => entry.puuid !== puuid);
  }

  return { platform, recent, remember, forget };
});
