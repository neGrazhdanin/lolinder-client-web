import { palette } from './tokens.mjs';

const channel = (value) => {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};
const luminance = (hex) => {
  const n = Number.parseInt(hex.slice(1), 16);
  return 0.2126 * channel(n >> 16) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
};
const contrast = (a, b) => {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
};

const TEXT = 4.5;
const GRAPHIC = 3;

const { scheme, results, tiers } = palette();
let failures = 0;

for (const theme of ['light', 'dark']) {
  const m = scheme[theme];
  const win = results.win[theme];
  const loss = results.loss[theme];
  const card = m.surfaceContainer;
  const muted = m.surfaceContainerHighest;
  const pairs = [
    ['foreground / background', m.onSurface, m.surface, TEXT],
    ['foreground / card', m.onSurface, card, TEXT],
    ['foreground / popover', m.onSurface, m.surfaceContainerHigh, TEXT],
    ['foreground / muted', m.onSurface, muted, TEXT],
    ['muted-foreground / background', m.onSurfaceVariant, m.surface, TEXT],
    ['muted-foreground / card', m.onSurfaceVariant, card, TEXT],
    ['muted-foreground / muted', m.onSurfaceVariant, muted, TEXT],
    ['muted-foreground / popover', m.onSurfaceVariant, m.surfaceContainerHigh, TEXT],
    ['primary-foreground / primary', m.onPrimary, m.primary, TEXT],
    ['secondary-foreground / secondary', m.onSecondaryContainer, m.secondaryContainer, TEXT],
    ['brand-muted-foreground / brand-muted', m.onPrimaryContainer, m.primaryContainer, TEXT],
    ['destructive / background', m.error, m.surface, TEXT],
    ['destructive / card', m.error, card, TEXT],
    ['ring / background', m.primary, m.surface, GRAPHIC],
    ['selected outline / toggle track', m.primary, muted, GRAPHIC],
    ['win / background', win.color, m.surface, TEXT],
    ['win / card', win.color, card, TEXT],
    ['loss / background', loss.color, m.surface, TEXT],
    ['loss / card', loss.color, card, TEXT],
    ['loss / muted', loss.color, muted, TEXT],
    ['loss / loss-muted', loss.color, loss.muted, TEXT],
    ['unranked mark / card', m.onSurfaceVariant, card, GRAPHIC],
    ['unranked text / unranked container', m.onSurface, m.surfaceContainerHigh, TEXT],
  ];
  for (const [name, tier] of Object.entries(tiers)) {
    const t = tier[theme];
    pairs.push(
      [`${name} ink / card`, t.ink, card, TEXT],
      [`${name} ink / background`, t.ink, m.surface, TEXT],
      [`${name} strong / container`, t.strong, t.container, TEXT],
      [`${name} foreground / container`, m.onSurface, t.container, TEXT],
      [`${name} muted-foreground / container`, m.onSurfaceVariant, t.container, TEXT],
      [`${name} mark / card`, t.mark, card, GRAPHIC],
      [`${name} mark / background`, t.mark, m.surface, GRAPHIC],
      [`${name} mark / container`, t.mark, t.container, GRAPHIC],
    );
  }

  let lowest = { name: '', ratio: Infinity };
  for (const [name, fg, bg, required] of pairs) {
    const ratio = contrast(fg, bg);
    if (ratio < required) {
      failures++;
      console.error(`FAIL ${theme}: ${name} ${ratio.toFixed(2)} < ${required}`);
    }
    if (required === TEXT && ratio < lowest.ratio) lowest = { name, ratio };
    if (process.argv.includes('--verbose')) console.log(`${theme}: ${name} ${ratio.toFixed(2)}`);
  }
  console.log(
    `${theme}: ${pairs.length} pairs, lowest text pair ${lowest.name} ${lowest.ratio.toFixed(2)}`,
  );
}

if (failures) {
  console.error(`${failures} pair(s) below the required contrast`);
  process.exitCode = 1;
}
