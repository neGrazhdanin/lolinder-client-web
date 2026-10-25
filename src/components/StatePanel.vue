<script setup lang="ts">
import { cn } from '@/shared/lib/utils';

const props = withDefaults(
  defineProps<{
    title: string;
    description?: string;
    tone?: 'neutral' | 'error';
    heading?: 'h1' | 'h2' | 'h3';
    class?: string;
  }>(),
  { description: undefined, tone: 'neutral', heading: 'h2', class: undefined },
);
</script>

<template>
  <section
    :class="cn('flex flex-col items-start gap-5 sm:flex-row sm:items-center', props.class)"
    :role="tone === 'error' ? 'alert' : undefined"
  >
    <span class="relative grid size-16 shrink-0 place-items-center" aria-hidden="true">
      <svg viewBox="0 0 48 48" class="absolute inset-0 size-full overflow-visible">
        <polygon
          points="24,3 42.19,13.5 42.19,34.5 24,45 5.81,34.5 5.81,13.5"
          stroke-linejoin="round"
          :class="tone === 'error' ? 'fill-loss-muted stroke-loss/40' : 'fill-muted stroke-border'"
          stroke-width="1.5"
        />
      </svg>
      <span
        class="relative [&_svg]:size-6"
        :class="tone === 'error' ? 'text-loss' : 'text-muted-foreground'"
      >
        <slot name="icon" />
      </span>
    </span>
    <div class="flex min-w-0 flex-col gap-1.5">
      <component
        :is="heading"
        :class="[
          'font-semibold tracking-tight text-balance',
          heading === 'h1' ? 'text-2xl sm:text-3xl' : 'text-base',
        ]"
      >
        {{ title }}
      </component>
      <p v-if="description" class="max-w-prose text-sm text-pretty text-muted-foreground">
        {{ description }}
      </p>
      <div v-if="$slots.default" class="mt-3 flex flex-wrap items-center gap-2">
        <slot />
      </div>
    </div>
  </section>
</template>
