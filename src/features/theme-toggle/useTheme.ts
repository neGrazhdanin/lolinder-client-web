import { useColorMode } from '@vueuse/core';

// index.html reads the same key before mount to avoid a flash of the wrong theme
export const THEME_STORAGE_KEY = 'lolinder-theme';

export function useTheme() {
  const { state, store } = useColorMode({ storageKey: THEME_STORAGE_KEY, disableTransition: true });

  function toggle(): void {
    store.value = state.value === 'dark' ? 'light' : 'dark';
  }

  return { theme: state, toggle };
}
