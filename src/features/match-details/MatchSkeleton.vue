<script setup lang="ts">
import { Skeleton } from '@/components/ui/skeleton';

defineProps<{ label: string }>();

const shimmer = 'animate-shimmer skeleton-shimmer';
</script>

<template>
  <div class="flex flex-col gap-6">
    <p class="sr-only" role="status">{{ label }}</p>
    <div
      class="flex flex-col gap-6 rounded-2xl bg-card p-5 sm:p-6 md:flex-row md:items-center md:justify-between"
      aria-hidden="true"
    >
      <div class="flex items-center gap-4">
        <Skeleton :class="[shimmer, 'size-14 rounded-xl sm:size-16']" />
        <div class="flex flex-col gap-2.5">
          <Skeleton :class="[shimmer, 'h-8 w-56 sm:h-9 sm:w-72']" />
          <Skeleton :class="[shimmer, 'h-4 w-64']" />
        </div>
      </div>
      <Skeleton :class="[shimmer, 'h-12 w-48']" />
    </div>

    <div v-for="team in 2" :key="team" class="rounded-xl bg-card py-3.5" aria-hidden="true">
      <Skeleton :class="[shimmer, 'mx-4 mb-3 h-4 w-28 sm:mx-5']" />
      <div
        v-for="row in 5"
        :key="row"
        class="flex items-center gap-3 px-4 py-2.5 sm:px-5 [&+&]:border-t [&+&]:border-border/60"
      >
        <Skeleton :class="[shimmer, 'size-10 rounded-lg']" />
        <div class="flex flex-1 flex-col gap-1.5">
          <Skeleton :class="[shimmer, 'h-3.5 w-32']" />
          <Skeleton :class="[shimmer, 'h-3 w-16']" />
        </div>
        <Skeleton :class="[shimmer, 'h-4 w-20']" />
        <div class="hidden gap-0.5 lg:flex">
          <Skeleton v-for="slot in 7" :key="slot" :class="[shimmer, 'size-6 rounded-[4px]']" />
        </div>
      </div>
    </div>
  </div>
</template>
