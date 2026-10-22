import { createRouter, createWebHistory } from 'vue-router';
import DefaultLayout from '@/app/layouts/DefaultLayout.vue';
import HomePage from '@/pages/HomePage.vue';
import { isLocale, preferredLocale, SUPPORTED_LOCALES, setLocale } from '@/shared/i18n';

const SectionPlaceholderPage = () => import('@/pages/SectionPlaceholderPage.vue');

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: `/:locale(${SUPPORTED_LOCALES.join('|')})`,
      component: DefaultLayout,
      children: [
        { path: '', name: 'home', component: HomePage },
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

router.beforeEach(async (to) => {
  if (isLocale(to.params.locale)) await setLocale(to.params.locale);
});
