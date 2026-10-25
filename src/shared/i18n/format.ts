import { useI18n } from 'vue-i18n';

const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 365 * 24 * 3600],
  ['month', 30 * 24 * 3600],
  ['week', 7 * 24 * 3600],
  ['day', 24 * 3600],
  ['hour', 3600],
  ['minute', 60],
];

// Intl formatters are expensive to build, and the LP chart formats on every pointer move.
const cache = new Map<string, unknown>();

function cached<T>(kind: string, locale: string, options: object, create: () => T): T {
  const key = `${kind}|${locale}|${JSON.stringify(options)}`;
  let formatter = cache.get(key) as T | undefined;
  if (!formatter) {
    formatter = create();
    cache.set(key, formatter);
  }
  return formatter;
}

const numberFormat = (locale: string, options: Intl.NumberFormatOptions = {}) =>
  cached('number', locale, options, () => new Intl.NumberFormat(locale, options));

export type RelativeStyle = Intl.RelativeTimeFormatStyle;

export function formatRelativeTime(
  date: Date,
  now: Date,
  locale: string,
  style: RelativeStyle = 'long',
): string {
  const seconds = (date.getTime() - now.getTime()) / 1000;
  const options = { numeric: 'auto', style } as const;
  const format = cached(
    'relative',
    locale,
    options,
    () => new Intl.RelativeTimeFormat(locale, options),
  );
  for (const [unit, size] of RELATIVE_UNITS) {
    if (Math.abs(seconds) >= size) return format.format(Math.round(seconds / size), unit);
  }
  // under a minute, "now" reads better than a ticking seconds counter
  return format.format(0, 'second');
}

export function useFormat() {
  const { locale } = useI18n();

  return {
    integer: (value: number) => numberFormat(locale.value).format(Math.round(value)),
    // Whole thousands below a million: "679,8 тыс." does not fit a mastery row on a phone.
    compact: (value: number) =>
      numberFormat(locale.value, {
        notation: 'compact',
        maximumFractionDigits: value >= 1_000_000 ? 1 : 0,
      }).format(value),
    percent: (value: number) =>
      numberFormat(locale.value, { style: 'percent', maximumFractionDigits: 0 }).format(value),
    signed: (value: number) =>
      numberFormat(locale.value, { signDisplay: 'exceptZero' }).format(value),
    date: (value: Date, options: Intl.DateTimeFormatOptions = { dateStyle: 'medium' }) =>
      cached(
        'date',
        locale.value,
        options,
        () => new Intl.DateTimeFormat(locale.value, options),
      ).format(value),
    relative: (value: Date, now: Date, style?: RelativeStyle) =>
      formatRelativeTime(value, now, locale.value, style),
  };
}
