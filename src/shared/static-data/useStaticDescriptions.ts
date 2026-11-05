import { useQuery } from '@tanstack/vue-query';
import { createSharedComposable } from '@vueuse/core';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  type StaticDataDescriptions,
  StaticLocale,
  staticDataControllerDescriptionsOptions,
} from '@/shared/api';
import { type MarkupNode, parseMarkup } from './markup';
import { useStaticData } from './useStaticData';

export interface Description {
  nodes: MarkupNode[];
  cooldownSec?: number | null;
}

export type DescribedKind = keyof StaticDataDescriptions;

export interface DescriptionLookup {
  get(kind: DescribedKind, id: number): Description | undefined;
}

const lookups = new WeakMap<StaticDataDescriptions, DescriptionLookup>();

function lookupFor(data: StaticDataDescriptions): DescriptionLookup {
  let lookup = lookups.get(data);
  if (lookup) return lookup;
  const byKind = new Map(
    (Object.keys(data) as DescribedKind[]).map((kind) => [
      kind,
      new Map(data[kind].map((entry) => [entry.id, entry])),
    ]),
  );
  const parsed = new Map<string, Description>();
  lookup = {
    get(kind, id) {
      const key = `${kind}:${id}`;
      const cached = parsed.get(key);
      if (cached) return cached;
      const entry = byKind.get(kind)?.get(id);
      if (!entry) return undefined;
      const description: Description = {
        nodes: parseMarkup(entry.description),
        cooldownSec: 'cooldownSec' in entry ? entry.cooldownSec : undefined,
      };
      parsed.set(key, description);
      return description;
    },
  };
  lookups.set(data, lookup);
  return lookup;
}

// Heavy and only needed on hover, so nothing loads until the first tooltip opens.
export const useStaticDescriptions = createSharedComposable(() => {
  const { locale } = useI18n();
  const { version } = useStaticData();
  const requested = ref(false);

  const query = useQuery(
    computed(() => ({
      ...staticDataControllerDescriptionsOptions({
        path: {
          version: version.value ?? '',
          locale: locale.value === StaticLocale.RU ? StaticLocale.RU : StaticLocale.EN,
        },
      }),
      enabled: requested.value && version.value !== undefined,
      staleTime: Infinity,
      gcTime: Infinity,
    })),
  );

  return {
    descriptions: computed(() => (query.data.value ? lookupFor(query.data.value) : undefined)),
    isPending: computed(() => !query.data.value && !query.isError.value),
    request: () => (requested.value = true),
  };
});
