import { Platform } from '@/shared/api';

export const PLATFORMS = Object.values(Platform);

export const PLATFORM_CODES: Record<Platform, string> = {
  br1: 'BR',
  eun1: 'EUNE',
  euw1: 'EUW',
  jp1: 'JP',
  kr: 'KR',
  la1: 'LAN',
  la2: 'LAS',
  me1: 'ME',
  na1: 'NA',
  oc1: 'OCE',
  ru: 'RU',
  sg2: 'SEA',
  tr1: 'TR',
  tw2: 'TW',
  vn2: 'VN',
};

export function isPlatform(value: unknown): value is Platform {
  return PLATFORMS.includes(value as Platform);
}

export function defaultPlatformFor(locale: string): Platform {
  return locale === 'ru' ? Platform.RU : Platform.EUW1;
}
