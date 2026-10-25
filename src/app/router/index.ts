import { createRouter, createWebHistory } from 'vue-router';
import DefaultLayout from '@/app/layouts/DefaultLayout.vue';
import HomePage from '@/pages/HomePage.vue';
import { isLocale, preferredLocale, SUPPORTED_LOCALES, setLocale } from '@/shared/i18n';
import { PLATFORMS } from '@/shared/riot';

const SectionPlaceholderPage = () => import('@/pages/SectionPlaceholderPage.vue');
const PlayerPage = () => import('@/pages/PlayerPage.vue');

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
});

// Paths match case-insensitively, so `/EN/players/KR/…` reaches these routes with params the
// app does not recognise; send it to the lowercase URL instead.
router.beforeEach(async (to) => {
  const locale = lowercase(to.params.locale);
  const platform = lowercase(to.params.platform);
  if (locale !== to.params.locale || platform !== to.params.platform) {
    return { ...to, params: { ...to.params, locale, platform } };
  }
  if (isLocale(locale)) await setLocale(locale);
});

function lowercase<T>(value: T): T {
  return (typeof value === 'string' ? value.toLowerCase() : value) as T;
}
