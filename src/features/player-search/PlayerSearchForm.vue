<script setup lang="ts">
import { ArrowRightIcon } from '@lucide/vue';
import { storeToRefs } from 'pinia';
import { onMounted, ref, useId, useTemplateRef, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { Button } from '@/components/ui/button';
import type { Platform } from '@/shared/api';
import { cn } from '@/shared/lib/utils';
import { parseRiotId, type RiotIdError, riotIdToSlug } from '@/shared/riot';
import RegionSelect from './RegionSelect.vue';
import { usePlayerSearchStore } from './store';

const props = withDefaults(
  defineProps<{
    variant?: 'hero' | 'compact';
    initialRiotId?: string;
    initialPlatform?: Platform;
    autofocus?: boolean;
    class?: string;
  }>(),
  {
    variant: 'hero',
    initialRiotId: '',
    initialPlatform: undefined,
    autofocus: false,
    class: undefined,
  },
);

const { t, locale } = useI18n();
const router = useRouter();
const store = usePlayerSearchStore();
const { platform: preferredPlatform } = storeToRefs(store);

const platform = ref<Platform>(props.initialPlatform ?? preferredPlatform.value);
const text = ref(props.initialRiotId);
const error = ref<RiotIdError | null>(null);
watch(text, () => (error.value = null));

const inputId = useId();
const input = useTemplateRef<HTMLInputElement>('input');
// the autofocus attribute only works on page load, not for an input mounted later
onMounted(() => props.autofocus && input.value?.focus());
const messageId = useId();

async function submit(): Promise<void> {
  const parsed = parseRiotId(text.value);
  if (!parsed.ok) {
    error.value = parsed.error;
    return;
  }
  preferredPlatform.value = platform.value;
  await router.push({
    name: 'player',
    params: { locale: locale.value, platform: platform.value, riotId: riotIdToSlug(parsed.value) },
  });
  if (props.variant === 'compact') text.value = '';
}
</script>

<template>
  <form
    role="search"
    :aria-label="t('search.label')"
    novalidate
    :class="cn('relative w-full', props.class)"
    @submit.prevent="submit"
  >
    <label v-if="variant === 'hero'" :for="inputId" class="mb-2.5 block text-sm font-medium">
      {{ t('search.riotId') }}
    </label>
    <div
      :class="
        cn(
          'flex items-stretch border bg-card transition-[border-color,box-shadow] focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 dark:bg-input/30',
          variant === 'hero' ? 'h-14 rounded-xl shadow-xs' : 'h-11 rounded-md sm:h-9',
          error &&
            'border-destructive focus-within:border-destructive focus-within:ring-destructive/30',
        )
      "
    >
      <RegionSelect
        v-model="platform"
        :size="variant === 'hero' ? 'default' : 'sm'"
        :class="variant === 'hero' ? 'rounded-l-xl pr-3 pl-4' : 'rounded-l-md pr-1.5 pl-2.5'"
      />
      <!-- The highlighted region already separates the two parts; a line beside it reads as a stray edge. -->
      <span
        class="my-2.5 w-px shrink-0 bg-border transition-opacity duration-150 peer-hover:opacity-0 peer-data-[state=open]:opacity-0"
        aria-hidden="true"
      />
      <input
        :id="inputId"
        ref="input"
        v-model="text"
        type="search"
        enterkeyhint="search"
        autocomplete="off"
        autocapitalize="off"
        spellcheck="false"
        maxlength="40"
        :placeholder="t('search.placeholder')"
        :aria-label="variant === 'compact' ? t('search.label') : undefined"
        :aria-invalid="error ? true : undefined"
        :aria-describedby="messageId"
        :class="[
          'w-0 min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:hidden',
          variant === 'hero' ? 'px-4 text-base' : 'px-2.5 text-base md:text-sm',
        ]"
      />
      <Button
        v-if="variant === 'hero'"
        type="submit"
        :aria-label="t('search.submit')"
        class="group/submit m-2 h-auto gap-2 rounded-lg px-4 sm:px-5"
      >
        <span class="hidden sm:inline">{{ t('search.submit') }}</span>
        <ArrowRightIcon
          class="transition-transform group-hover/submit:translate-x-0.5"
          aria-hidden="true"
        />
      </Button>
    </div>

    <p
      v-if="variant === 'hero'"
      :id="messageId"
      :role="error ? 'alert' : undefined"
      class="mt-2.5 text-sm"
      :class="error ? 'text-destructive' : 'text-muted-foreground'"
    >
      {{ error ? t(`search.errors.${error}`) : t('search.hint') }}
    </p>
    <p
      v-else-if="error"
      :id="messageId"
      role="alert"
      class="absolute top-full left-0 z-10 mt-1.5 rounded-md bg-popover px-2.5 py-1.5 text-xs text-destructive shadow-md ring-1 ring-foreground/10"
    >
      {{ t(`search.errors.${error}`) }}
    </p>
    <span v-else :id="messageId" class="sr-only">{{ t('search.hint') }}</span>
  </form>
</template>
