<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import type { Platform } from '@/shared/api';
import { cn } from '@/shared/lib/utils';
import { isPlatform, PLATFORM_CODES, PLATFORMS } from '@/shared/riot';

const props = defineProps<{ class?: string; size?: 'sm' | 'default' }>();
const model = defineModel<Platform>({ required: true });

const { t } = useI18n();

function select(value: unknown): void {
  if (isPlatform(value)) model.value = value;
}
</script>

<template>
  <Select :model-value="model" @update:model-value="select">
    <SelectTrigger
      :size="size"
      :aria-label="t('search.region')"
      :class="
        cn(
          'peer h-auto cursor-pointer self-stretch rounded-none border-0 bg-transparent font-mono text-xs font-medium tracking-wide shadow-none transition-colors select-none hover:bg-accent/70 focus-visible:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset data-[size=default]:h-auto data-[size=sm]:h-auto data-[state=open]:bg-accent dark:bg-transparent dark:hover:bg-accent/70 dark:data-[state=open]:bg-accent [&_svg]:transition-transform [&_svg]:duration-200 data-[state=open]:[&_svg]:rotate-180 motion-reduce:[&_svg]:transition-none',
          props.class,
        )
      "
    >
      <!-- Fixed width: codes run from 2 to 4 letters, and the input text would shift on every change. -->
      <span class="w-[4ch] text-left">{{ PLATFORM_CODES[model] }}</span>
    </SelectTrigger>
    <SelectContent position="popper" align="start" class="max-h-80 min-w-56 p-1 duration-150">
      <SelectItem
        v-for="platform in PLATFORMS"
        :key="platform"
        :value="platform"
        class="transition-colors"
      >
        <span class="w-11 font-mono text-xs text-muted-foreground">
          {{ PLATFORM_CODES[platform] }}
        </span>
        {{ t(`platforms.${platform}`) }}
      </SelectItem>
    </SelectContent>
  </Select>
</template>
