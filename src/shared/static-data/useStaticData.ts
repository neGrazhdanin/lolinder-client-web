import { keepPreviousData, useQuery } from '@tanstack/vue-query';
import { createSharedComposable } from '@vueuse/core';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  type StaticDataBundle,
  StaticLocale,
  staticDataControllerBundleOptions,
  staticDataControllerLatestOptions,
} from '@/shared/api';
import { createStaticLookup, type StaticLookup } from './lookup';

const lookups = new WeakMap<StaticDataBundle, StaticLookup>();

function lookupFor(bundle: StaticDataBundle): StaticLookup {
  let lookup = lookups.get(bundle);
  if (!lookup) {
    lookup = createStaticLookup(bundle);
    lookups.set(bundle, lookup);
  }
  return lookup;
}

// Every champion and profile icon reads it; one shared instance instead of a pair of queries each.
export const useStaticData = createSharedComposable(() => {
  const { locale } = useI18n();

  const latest = useQuery({ ...staticDataControllerLatestOptions(), staleTime: 60 * 60_000 });
  const version = computed(() => latest.data.value?.version);

  const bundle = useQuery(
    computed(() => ({
      ...staticDataControllerBundleOptions({
        path: {
          version: version.value ?? '',
          locale: locale.value === StaticLocale.RU ? StaticLocale.RU : StaticLocale.EN,
        },
      }),
      enabled: version.value !== undefined,
      // bundles are immutable per version and locale
      staleTime: Infinity,
      gcTime: Infinity,
      // keeps icons on screen while the other language loads
      placeholderData: keepPreviousData,
    })),
  );

  const lookup = computed(() => (bundle.data.value ? lookupFor(bundle.data.value) : undefined));

  return {
    version,
    lookup,
    isError: computed(() => latest.isError.value || bundle.isError.value),
  };
});
