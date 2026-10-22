<script setup lang="ts">
import { Toaster } from '@/components/ui/sonner';
import { useTheme } from '@/features/theme-switcher';

const { state: theme } = useTheme();
</script>

<template>
  <RouterView />
  <Toaster :theme="theme" />
</template>
