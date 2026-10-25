import { useI18n } from 'vue-i18n';
import { type Division, isApexTier, type Tier } from '@/shared/riot';

export function useRankName() {
  const { t } = useI18n();

  return (tier: Tier, division: Division | null): string => {
    const name = t(`player.tiers.${tier}`);
    return isApexTier(tier) || !division ? name : t('player.rank.name', { tier: name, division });
  };
}
