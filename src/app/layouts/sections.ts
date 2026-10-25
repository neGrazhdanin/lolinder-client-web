import { ChartColumnIcon, GitForkIcon, HeartHandshakeIcon, UsersIcon } from '@lucide/vue';
import { computed } from 'vue';
import { useRoute } from 'vue-router';

export const SECTIONS = [
  { route: 'home', label: 'nav.stats', icon: ChartColumnIcon },
  { route: 'builds', label: 'nav.builds', icon: GitForkIcon },
  { route: 'duo', label: 'nav.duo', icon: HeartHandshakeIcon },
  { route: 'flex', label: 'nav.flex', icon: UsersIcon },
] as const;

const SECTION_OF_ROUTE: Record<string, (typeof SECTIONS)[number]['route']> = { player: 'home' };

/** Player pages live under Stats, though their route is not the Stats link itself. */
export function useCurrentSection() {
  const route = useRoute();
  return computed(() => {
    const name = String(route.name);
    return SECTION_OF_ROUTE[name] ?? SECTIONS.find((section) => section.route === name)?.route;
  });
}
