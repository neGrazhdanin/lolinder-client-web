import { ChartColumnIcon, GitForkIcon, HeartHandshakeIcon, UsersIcon } from '@lucide/vue';

export const SECTIONS = [
  { route: 'home', label: 'nav.stats', icon: ChartColumnIcon },
  { route: 'builds', label: 'nav.builds', icon: GitForkIcon },
  { route: 'duo', label: 'nav.duo', icon: HeartHandshakeIcon },
  { route: 'flex', label: 'nav.flex', icon: UsersIcon },
] as const;
