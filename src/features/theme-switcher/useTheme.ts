import { useColorMode } from '@vueuse/core';

// index.html reads the same key before mount to avoid a flash of the wrong theme
export const THEME_STORAGE_KEY = 'lolinder-theme';

export const THEME_MODES = ['light', 'dark', 'auto'] as const;

export function useTheme() {
  return useColorMode({ storageKey: THEME_STORAGE_KEY, disableTransition: true });
}
