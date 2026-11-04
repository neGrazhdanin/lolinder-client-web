import { createRouter, createWebHistory } from 'vue-router';
import DefaultLayout from '@/app/layouts/DefaultLayout.vue';
import HomePage from '@/pages/HomePage.vue';
import { isLocale, preferredLocale, SUPPORTED_LOCALES, setLocale } from '@/shared/i18n';
import { PLATFORMS } from '@/shared/riot';
import { nextPageEntered, pageKey } from './page-key';

const SectionPlaceholderPage = () => import('@/pages/SectionPlaceholderPage.vue');
const PlayerPage = () => import('@/pages/PlayerPage.vue');
const MatchPage = () => import('@/pages/MatchPage.vue');

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: `/:locale(${SUPPORTED_LOCALES.join('|')})`,
      component: DefaultLayout,
      children: [
        { path: '', name: 'home', component: HomePage },
        {
          path: `players/:platform(${PLATFORMS.join('|')})/:riotId`,
          name: 'player',
          component: PlayerPage,
          props: true,
        },
        {
          path: 'matches/:matchId([A-Z0-9]{2,8}_\\d{1,20})',
          name: 'match',
          component: MatchPage,
          props: (route) => ({
            locale: route.params.locale,
            matchId: route.params.matchId,
            player: typeof route.query.player === 'string' ? route.query.player : undefined,
          }),
        },
        { path: 'builds', name: 'builds', component: SectionPlaceholderPage },
        { path: 'duo', name: 'duo', component: SectionPlaceholderPage },
        { path: 'flex', name: 'flex', component: SectionPlaceholderPage },
        {
          path: ':pathMatch(.*)*',
          name: 'not-found',
          component: () => import('@/pages/NotFoundPage.vue'),
        },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: (to) => `/${preferredLocale()}${to.fullPath === '/' ? '' : to.fullPath}`,
    },
  ],
  scrollBehavior(to, from, savedPosition) {
    if (from.matched.length === 0) return savedPosition ?? false;
    if (pageKey(to) === pageKey(from)) return false;
    return nextPageEntered().then(() => savedPosition ?? { top: 0 });
  },
});

// Paths match case-insensitively, so `/EN/players/KR/…` reaches these routes with params the
// app does not recognise; send it to the canonical URL instead (match IDs are upper case).
router.beforeEach(async (to) => {
  const locale = lowercase(to.params.locale);
  const platform = lowercase(to.params.platform);
  const matchId = uppercase(to.params.matchId);
  if (
    locale !== to.params.locale ||
    platform !== to.params.platform ||
    matchId !== to.params.matchId
  ) {
    return { ...to, params: { ...to.params, locale, platform, matchId } };
  }
  if (isLocale(locale)) await setLocale(locale);
});

function lowercase<T>(value: T): T {
  return (typeof value === 'string' ? value.toLowerCase() : value) as T;
}

function uppercase<T>(value: T): T {
  return (typeof value === 'string' ? value.toUpperCase() : value) as T;
}
