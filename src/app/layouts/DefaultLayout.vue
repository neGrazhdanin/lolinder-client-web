<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import AppHeader from './AppHeader.vue';
import MobileTabBar from './MobileTabBar.vue';

const { t } = useI18n();
</script>

<template>
  <div class="flex min-h-svh flex-col pb-[calc(3.5rem+env(safe-area-inset-bottom))] md:pb-0">
    <AppHeader />

    <main class="mx-auto w-full max-w-page flex-1 px-4 py-8 sm:px-6">
      <RouterView />
    </main>

    <footer class="border-t">
      <p class="mx-auto max-w-page px-4 py-6 text-xs text-muted-foreground sm:px-6">
        {{ t('footer.legal') }}
      </p>
    </footer>

    <MobileTabBar />
  </div>
</template>
