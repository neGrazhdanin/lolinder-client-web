import {
  argbFromHex,
  Blend,
  Hct,
  hexFromArgb,
  MaterialDynamicColors as M,
  SchemeTonalSpot,
  TonalPalette,
} from '@material/material-color-utilities';

export const SEED = '#fbaffe';

const seed = argbFromHex(SEED);

const ROLES = {
  surface: M.surface,
  surfaceContainerLow: M.surfaceContainerLow,
  surfaceContainer: M.surfaceContainer,
  surfaceContainerHigh: M.surfaceContainerHigh,
  surfaceContainerHighest: M.surfaceContainerHighest,
  onSurface: M.onSurface,
  onSurfaceVariant: M.onSurfaceVariant,
  primary: M.primary,
  onPrimary: M.onPrimary,
  primaryContainer: M.primaryContainer,
  onPrimaryContainer: M.onPrimaryContainer,
  secondary: M.secondary,
  secondaryContainer: M.secondaryContainer,
  onSecondaryContainer: M.onSecondaryContainer,
  tertiary: M.tertiary,
  outlineVariant: M.outlineVariant,
  error: M.error,
};

function scheme(dark) {
  const s = new SchemeTonalSpot(Hct.fromInt(seed), dark, 0);
  return Object.fromEntries(
    Object.entries(ROLES).map(([name, role]) => [name, hexFromArgb(role.getArgb(s))]),
  );
}

// Harmonized like M3 custom colors, but the muted tone comes from a low-chroma palette:
// the stock tone-30 container is far too loud as a large dark surface.
function result(base) {
  const harmonized = Blend.harmonize(argbFromHex(base), seed);
  const palette = TonalPalette.fromInt(harmonized);
  const soft = TonalPalette.fromHueAndChroma(Hct.fromInt(harmonized).hue, 18);
  return {
    light: { color: hexFromArgb(palette.tone(40)), muted: hexFromArgb(soft.tone(92)) },
    dark: { color: hexFromArgb(palette.tone(80)), muted: hexFromArgb(soft.tone(18)) },
  };
}

// Not harmonized: pulling tier hues towards the seed made Iron and Silver warm and Diamond violet.
const TIERS = {
  IRON: ['#6e6259', 4],
  BRONZE: ['#9c5f3a', 30],
  SILVER: ['#7d8a99', 6],
  GOLD: ['#c59a2c', 40],
  PLATINUM: ['#1f9d8f', 30],
  EMERALD: ['#2f9b56', 36],
  DIAMOND: ['#4f63d9', 40],
  MASTER: ['#9445c6', 40],
  GRANDMASTER: ['#c9324a', 44],
  CHALLENGER: ['#2b95d6', 36],
};

function tier(base, chroma) {
  const hue = Hct.fromInt(argbFromHex(base)).hue;
  const palette = TonalPalette.fromHueAndChroma(hue, chroma);
  const flat = TonalPalette.fromHueAndChroma(hue, Math.min(chroma, 14));
  const t = (tone) => hexFromArgb(palette.tone(tone));
  const f = (tone) => hexFromArgb(flat.tone(tone));
  return {
    light: { mark: t(50), ink: t(40), strong: t(20), container: f(92), line: t(80) },
    dark: { mark: t(70), ink: t(80), strong: t(90), container: f(20), line: t(40) },
  };
}

export function palette() {
  return {
    scheme: { light: scheme(false), dark: scheme(true) },
    results: { win: result('#1565c0'), loss: result('#c62828') },
    tiers: Object.fromEntries(
      Object.entries(TIERS).map(([name, [base, chroma]]) => [name, tier(base, chroma)]),
    ),
  };
}
