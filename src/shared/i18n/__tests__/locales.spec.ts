import { describe, expect, it } from 'vitest';
import en from '@/locales/en.json';
import ru from '@/locales/ru.json';

function keyPaths(messages: object, prefix = ''): string[] {
  return Object.entries(messages).flatMap(([key, value]) =>
    typeof value === 'object' && value !== null
      ? keyPaths(value, `${prefix}${key}.`)
      : [`${prefix}${key}`],
  );
}

describe('locale dictionaries', () => {
  it('ru and en have the same keys', () => {
    expect(keyPaths(ru).sort()).toEqual(keyPaths(en).sort());
  });
});
