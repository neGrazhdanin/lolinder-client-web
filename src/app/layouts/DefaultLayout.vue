<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { LocaleSwitcher } from '@/features/locale-switcher';
import { ThemeSwitcher } from '@/features/theme-switcher';

const { t, locale } = useI18n();
</script>

<template>
  <div class="flex min-h-svh flex-col">
    <header class="border-b">
      <div class="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4">
        <RouterLink
          :to="{ name: 'home', params: { locale } }"
          class="mr-auto text-lg font-semibold tracking-tight"
        >
          {{ t('app.name') }}
        </RouterLink>
        <LocaleSwitcher />
        <ThemeSwitcher />
      </div>
    </header>

    <main class="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      <RouterView />
    </main>

    <footer class="border-t">
      <p class="mx-auto max-w-6xl px-4 py-6 text-xs text-muted-foreground">
        {{ t('footer.legal') }}
      </p>
    </footer>
  </div>
</template>
