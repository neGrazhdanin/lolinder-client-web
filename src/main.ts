import '@/styles/main.css';

import { VueQueryPlugin } from '@tanstack/vue-query';
import { createPinia } from 'pinia';
import { createApp } from 'vue';
import App from '@/app/App.vue';
import { router } from '@/app/router';
import { i18n } from '@/shared/i18n';

createApp(App)
  .use(createPinia())
  .use(i18n)
  .use(VueQueryPlugin, {
    queryClientConfig: { defaultOptions: { queries: { staleTime: 30_000 } } },
  })
  .use(router)
  .mount('#app');
