import { fullMatch, matchPage, matchTimeline, PUUID, player, profile } from './fixtures/data';
import { expect, test } from './fixtures/mock';

const MATCH = /^\/matches\/EUW1_7000000000$/;
const TIMELINE = /^\/matches\/EUW1_7000000000\/timeline$/;
const DESCRIPTIONS = /^\/static-data\/[\d.]+\/en\/descriptions$/;

test.beforeEach(async ({ api }) => {
  const match = fullMatch(0);
  api.on('GET', MATCH, { body: match });
  api.on('GET', TIMELINE, { body: matchTimeline(match) });
});

test('describes an item on hover, loading descriptions only then', async ({ page, api }) => {
  await page.goto(`/en/matches/EUW1_7000000000?player=${PUUID}`);
  const blue = page.getByRole('table', { name: 'Victory Blue side' });
  const deathcap = blue
    .locator('tbody > tr.player-row')
    .first()
    .getByRole('img', { name: "Rabadon's Deathcap" });
  await expect(deathcap).toBeVisible();
  expect(api.count('GET', DESCRIPTIONS)).toBe(0);

  await deathcap.hover();
  const tooltip = page.locator('[data-slot=game-tooltip]');
  await expect(tooltip).toContainText("Rabadon's Deathcap");
  await expect(tooltip).toContainText('3,600');
  await expect(tooltip).toContainText('130 Ability Power');
  await expect(tooltip).toContainText('Increases your total Ability Power by 30%.');
  await expect(page.getByRole('tooltip')).toContainText('Cost 3,600. 130 Ability Power');
  await expect(page.locator('[data-reka-popper-content-wrapper] script')).toHaveCount(0);
  expect(api.count('GET', DESCRIPTIONS)).toBe(1);
});

test('shows the cooldown of a summoner spell when focused from the keyboard', async ({ page }) => {
  await page.goto(`/en/matches/EUW1_7000000000?player=${PUUID}`);
  const flash = page
    .locator('tbody > tr.player-row')
    .first()
    .getByRole('img', { name: 'Flash' })
    .first();
  await expect(flash).toBeVisible();
  await flash.locator('xpath=..').focus();
  const tooltip = page.locator('[data-slot=game-tooltip]');
  await expect(tooltip).toContainText('300 s');
  await expect(tooltip).toContainText('Teleports a short distance.');
  await page.keyboard.press('Escape');
  await expect(tooltip).toHaveCount(0);
});

test('describes items in the match history without opening the match', async ({ page, api }) => {
  api.on('GET', /^\/players\/search$/, { body: player });
  api.on('GET', new RegExp(`^/players/${PUUID}$`), { body: profile });
  api.on('GET', new RegExp(`^/players/${PUUID}/matches$`), { body: matchPage(0, 1, null) });

  await page.goto('/en/players/euw1/Chamomile-EUW');
  const card = page.getByRole('region', { name: 'Match history' }).getByRole('article').first();
  await card.getByRole('img', { name: "Rabadon's Deathcap" }).hover();
  await expect(page.locator('[data-slot=game-tooltip]')).toContainText('130 Ability Power');

  await card.getByRole('img', { name: "Rabadon's Deathcap" }).click();
  await expect(page).toHaveURL(/\/players\/euw1\/Chamomile-EUW$/);
});

test.describe('touch', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test('opens on tap without expanding the row, closes on a tap outside', async ({ page }) => {
    await page.goto(`/en/matches/EUW1_7000000000?player=${PUUID}`);
    const row = page.locator('tbody > tr.player-row').first();
    const toggle = row.getByRole('button', { name: /^Details for/ });
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');

    await row.getByRole('img', { name: "Rabadon's Deathcap" }).tap();
    await expect(page.locator('[data-slot=game-tooltip]')).toContainText('130 Ability Power');
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');

    await page.getByRole('heading', { level: 1 }).tap();
    await expect(page.locator('[data-slot=game-tooltip]')).toHaveCount(0);
  });
});
