import { createI18n } from 'vue-i18n';
import type en from '@/locales/en.json';

type MessageSchema = typeof en;

declare module 'vue-i18n' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface DefineLocaleMessage extends MessageSchema {}
}

export const SUPPORTED_LOCALES = ['ru', 'en'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';

const STORAGE_KEY = 'lolinder-locale';

const loaders = import.meta.glob<MessageSchema>('../../locales/*.json', { import: 'default' });

export const i18n = createI18n({
  legacy: false,
  locale: DEFAULT_LOCALE,
  fallbackLocale: DEFAULT_LOCALE,
});

export function isLocale(value: unknown): value is Locale {
  return SUPPORTED_LOCALES.includes(value as Locale);
}

export function preferredLocale(): Locale {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (isLocale(saved)) return saved;

  const fromBrowser = navigator.languages
    .map((tag) => tag.split('-')[0])
    .find((lang) => isLocale(lang));
  return fromBrowser ?? DEFAULT_LOCALE;
}

export function rememberLocale(locale: Locale): void {
  localStorage.setItem(STORAGE_KEY, locale);
}

// availableLocales can't be used here: it already lists the initial locale with empty messages
const loadedLocales = new Set<Locale>();

export async function setLocale(locale: Locale): Promise<void> {
  if (!loadedLocales.has(locale)) {
    const load = loaders[`../../locales/${locale}.json`];
    if (!load) throw new Error(`No messages for locale "${locale}"`);
    i18n.global.setLocaleMessage(locale, await load());
    loadedLocales.add(locale);
  }
  i18n.global.locale.value = locale;
  document.documentElement.lang = locale;
}
