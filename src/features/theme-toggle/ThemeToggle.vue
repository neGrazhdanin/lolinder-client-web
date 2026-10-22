<script setup lang="ts">
import { MoonIcon, SunIcon } from '@lucide/vue';
import { useI18n } from 'vue-i18n';
import { Button } from '@/components/ui/button';
import { useTheme } from './useTheme';

const { t } = useI18n();
const { theme, toggle } = useTheme();
</script>

<template>
  <Button variant="outline" size="icon" :aria-label="t('theme.toggle')" @click="toggle">
    <SunIcon v-if="theme === 'dark'" />
    <MoonIcon v-else />
  </Button>
</template>
