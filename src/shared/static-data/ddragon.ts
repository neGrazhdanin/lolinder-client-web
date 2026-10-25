const CDN = 'https://ddragon.leagueoflegends.com/cdn';

export const ddragonUrl = {
  champion: (version: string, image: string) => `${CDN}/${version}/img/champion/${image}`,
  item: (version: string, image: string) => `${CDN}/${version}/img/item/${image}`,
  summonerSpell: (version: string, image: string) => `${CDN}/${version}/img/spell/${image}`,
  profileIcon: (version: string, iconId: number) =>
    `${CDN}/${version}/img/profileicon/${iconId}.png`,
  // rune icons live outside the versioned tree
  rune: (icon: string) => `${CDN}/img/${icon}`,
};
