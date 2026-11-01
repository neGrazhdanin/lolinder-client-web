<script setup lang="ts">
import { Skeleton } from '@/components/ui/skeleton';

withDefaults(defineProps<{ label: string; header?: boolean }>(), { header: true });

const shimmer = 'animate-shimmer skeleton-shimmer';
</script>

<template>
  <div class="flex flex-col gap-8">
    <p class="sr-only" role="status">{{ label }}</p>
    <div v-if="header" class="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div class="flex items-center gap-4 sm:gap-5">
        <Skeleton :class="[shimmer, 'size-16 rounded-2xl sm:size-20']" />
        <div class="flex flex-col gap-2.5">
          <Skeleton :class="[shimmer, 'h-7 w-48 sm:h-9 sm:w-64']" />
          <div class="flex items-center gap-2.5">
            <Skeleton :class="[shimmer, 'h-5 w-10']" />
            <Skeleton :class="[shimmer, 'h-4 w-36']" />
          </div>
        </div>
      </div>
      <Skeleton :class="[shimmer, 'h-10 w-28']" />
    </div>
    <slot />

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-8">
      <div class="grid grid-cols-1 content-start gap-4 sm:grid-cols-2 lg:grid-cols-1">
        <div v-for="card in 2" :key="card" class="rounded-xl bg-card p-5">
          <Skeleton :class="[shimmer, 'h-4 w-28']" />
          <div class="mt-4 flex items-center gap-4">
            <svg viewBox="0 0 48 48" class="size-14" aria-hidden="true">
              <polygon
                points="24,3 42.19,13.5 42.19,34.5 24,45 5.81,34.5 5.81,13.5"
                class="fill-muted"
              />
            </svg>
            <div class="flex flex-1 flex-col gap-2">
              <Skeleton :class="[shimmer, 'h-5 w-32']" />
              <Skeleton :class="[shimmer, 'h-3 w-24']" />
            </div>
            <Skeleton :class="[shimmer, 'h-7 w-14']" />
          </div>
          <Skeleton :class="[shimmer, 'mt-4 h-1.5 w-full rounded-full']" />
          <div class="mt-5 grid grid-cols-3 gap-3 border-t pt-4">
            <div v-for="stat in 3" :key="stat" class="flex flex-col gap-1.5">
              <Skeleton :class="[shimmer, 'h-3 w-12']" />
              <Skeleton :class="[shimmer, 'h-4 w-10']" />
            </div>
          </div>
        </div>
      </div>

      <div class="flex flex-col gap-6">
        <div class="rounded-xl bg-card p-5">
          <div class="flex items-center justify-between">
            <Skeleton :class="[shimmer, 'h-5 w-28']" />
            <Skeleton :class="[shimmer, 'h-8 w-36 rounded-lg']" />
          </div>
          <Skeleton :class="[shimmer, 'mt-5 h-48 w-full rounded-lg sm:h-56']" />
        </div>
        <div class="rounded-xl bg-card p-5">
          <Skeleton :class="[shimmer, 'h-5 w-32']" />
          <div class="mt-3 grid gap-x-8 sm:grid-flow-col sm:grid-cols-2 sm:grid-rows-5">
            <div v-for="row in 10" :key="row" class="flex items-center gap-3 py-2.5">
              <Skeleton :class="[shimmer, 'size-10 rounded-md']" />
              <div class="flex flex-1 flex-col gap-1.5">
                <Skeleton :class="[shimmer, 'h-3.5 w-24']" />
                <Skeleton :class="[shimmer, 'h-3 w-32']" />
              </div>
              <Skeleton :class="[shimmer, 'h-3.5 w-12']" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
