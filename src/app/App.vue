<script setup lang="ts">
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useTheme } from '@/features/theme-toggle';

const { theme } = useTheme();
</script>

<template>
  <TooltipProvider :delay-duration="250">
    <RouterView />
  </TooltipProvider>
  <Toaster :theme="theme" />
</template>
