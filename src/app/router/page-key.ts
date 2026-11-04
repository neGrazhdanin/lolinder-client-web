import type { RouteLocationNormalized } from 'vue-router';

// Switching the language or fixing a Riot ID's casing in the URL keeps the page mounted.
export function pageKey(route: RouteLocationNormalized): string {
  const { platform, riotId, matchId } = route.params;
  return [
    String(route.name),
    platform,
    typeof riotId === 'string' ? riotId.toLowerCase() : '',
    matchId,
  ]
    .filter(Boolean)
    .join(':');
}

let swapped: (() => void) | undefined;

export function pageEntered(): void {
  swapped?.();
  swapped = undefined;
}

// Pages swap out-in: scrolling right away would move the page that is fading out.
export function nextPageEntered(timeoutMs = 600): Promise<void> {
  swapped?.();
  return new Promise((resolve) => {
    swapped = resolve;
    setTimeout(resolve, timeoutMs);
  });
}
