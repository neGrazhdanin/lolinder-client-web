import {
  ARENA_PLACEMENTS,
  fullArenaMatch,
  fullMatch,
  matchPage,
  PUUID,
  player,
  profile,
} from './fixtures/data';
import { expect, notFound, test } from './fixtures/mock';

const SEARCH = /^\/players\/search$/;
const PROFILE = new RegExp(`^/players/${PUUID}$`);
const MATCHES = new RegExp(`^/players/${PUUID}/matches$`);
const MATCH = /^\/matches\/EUW1_7000000000$/;
const MATCH_URL = `/en/matches/EUW1_7000000000?player=${PUUID}`;

test.beforeEach(({ api }) => {
  api.on('GET', SEARCH, { body: player });
  api.on('GET', PROFILE, { body: profile });
  api.on('GET', MATCHES, { body: matchPage(0, 3, null) });
});

test('opens a match from the profile and shows both teams', async ({ page, api }) => {
  api.on('GET', MATCH, { body: fullMatch(0) });

  await page.goto('/en/players/euw1/Chamomile-EUW');
  const history = page.getByRole('region', { name: 'Match history' });
  await history.getByRole('link', { name: 'Victory Ahri' }).first().click();

  await expect(page).toHaveURL(MATCH_URL);
  await expect(page).toHaveTitle(/^Ranked Solo\/Duo, .+ · lolinder$/);
  const heading = page.getByRole('heading', { level: 1 });
  await expect(heading).toContainText('Victory');
  await expect(heading).toContainText('Ranked Solo/Duo');
  await expect(heading).toBeFocused();
  await expect(page.getByText('Kills: blue side 32, red side 18')).toBeAttached();

  const blue = page.getByRole('table', { name: 'Victory Blue side' });
  const red = page.getByRole('table', { name: 'Defeat Red side' });
  await expect(blue.locator('tbody > tr.player-row')).toHaveCount(5);
  await expect(red.locator('tbody > tr.player-row')).toHaveCount(5);
  await expect(page.getByRole('table')).toHaveCount(2);

  const blueTotals = blue.locator('tfoot').getByRole('row');
  await expect(blueTotals).toContainText('Team total');
  await expect(blueTotals).toContainText('Kills 32, deaths 18, assists 49');
  await expect(blueTotals).toContainText('95,921');
  await expect(blueTotals).toContainText('56,855');
  await expect(red.locator('tfoot')).toContainText('Kills 18, deaths 35, assists 21');

  const viewed = page.locator('tr[data-viewed]');
  await expect(viewed).toHaveCount(1);
  await expect(viewed).toContainText('Chamomile#EUW');
  await expect(viewed).toContainText('24,310');
  await expect(viewed.getByRole('img', { name: "Rabadon's Deathcap" })).toBeVisible();
  await expect(viewed.getByRole('img', { name: 'Electrocute' })).toBeVisible();

  await expect(page.getByRole('heading', { name: 'Comments' })).toBeVisible();
  await expect(page.getByText('Comments will appear here.')).toBeVisible();
});

test('links players to their profiles, except bots', async ({ page, api }) => {
  api.on('GET', MATCH, { body: fullMatch(0) });

  await page.goto(MATCH_URL);
  const blue = page.getByRole('table', { name: 'Victory Blue side' });
  await expect(blue.getByRole('link', { name: 'Earl Grey#EUW' })).toHaveAttribute(
    'href',
    '/en/players/euw1/Earl%20Grey-EUW',
  );
  const bot = blue.locator('tbody > tr.player-row').nth(4);
  await expect(bot).toContainText('Bot');
  await expect(bot.getByRole('link')).toHaveCount(0);

  const sencha = { ...player, puuid: 'e2e-player-5'.padEnd(78, '0'), gameName: 'Sencha' };
  api.on('GET', SEARCH, { body: sencha });
  api.on('GET', new RegExp(`^/players/${sencha.puuid}$`), { body: { ...profile, ...sencha } });
  api.on('GET', new RegExp(`^/players/${sencha.puuid}/matches$`), { body: matchPage(0, 1, null) });

  await page.getByRole('table', { name: 'Defeat Red side' }).getByRole('link').first().click();
  await expect(page).toHaveURL('/en/players/euw1/Sencha-EUW');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Sencha');
});

test('goes back to the profile the match was opened from', async ({ page, api }) => {
  api.on('GET', MATCH, { body: fullMatch(0) });

  await page.goto(MATCH_URL);
  await page.getByRole('link', { name: 'Back to Chamomile#EUW' }).click();
  await expect(page).toHaveURL('/en/players/euw1/Chamomile-EUW');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Chamomile');
});

test('shows a match without a viewed player', async ({ page, api }) => {
  api.on('GET', MATCH, { body: fullMatch(0) });

  await page.goto('/en/matches/EUW1_7000000000');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Ranked Solo/Duo');
  await expect(page.locator('tr[data-viewed]')).toHaveCount(0);
  await expect(page.getByRole('link', { name: /^Back to/ })).toHaveCount(0);
  await expect(page.getByRole('table')).toHaveCount(2);
});

test('marks a remake', async ({ page, api }) => {
  api.on('GET', MATCH, { body: fullMatch(0, { remake: true, durationSec: 190 }) });

  await page.goto('/en/matches/EUW1_7000000000');
  await expect(page.locator('main header')).toContainText('Remake');
  await expect(page.getByRole('table', { name: 'Remake Blue side' })).toBeVisible();
});

test('orders Arena duos by placement', async ({ page, api }) => {
  api.on('GET', MATCH, { body: fullArenaMatch(0) });

  await page.goto(MATCH_URL);
  const heading = page.getByRole('heading', { level: 1 });
  await expect(heading).toContainText('2nd');
  await expect(heading).toContainText('Arena');
  await expect(page.getByText(/^Kills: blue side/)).toHaveCount(0);

  const duos = page.getByRole('table');
  await expect(duos).toHaveCount(8);
  for (const [index, name] of ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'].entries()) {
    await expect(duos.nth(index)).toHaveAccessibleName(name);
    await expect(duos.nth(index).locator('tbody > tr.player-row')).toHaveCount(2);
  }

  const winners = 1 + ARENA_PLACEMENTS.indexOf(1);
  await expect(duos.first()).toContainText(`Duo ${2 * (winners - 1)}#EUW`);
  await expect(duos.first()).toContainText(`Duo ${2 * (winners - 1) + 1}#EUW`);
  await expect(duos.nth(1).locator('tr[data-viewed]')).toContainText('Duo 0#EUW');
  await expect(page.locator('tfoot')).toHaveCount(0);
});

test('says when the match is not found', async ({ page, api }) => {
  api.on('GET', MATCH, notFound('MATCH_NOT_FOUND'));

  await page.goto(MATCH_URL);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Match not found');
  await page.getByRole('link', { name: 'Back to home' }).click();
  await expect(page).toHaveURL('/en');
});

test('treats a link without a match ID as a missing page', async ({ page, api }) => {
  await page.goto('/en/matches/not-a-match');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Page not found');
  expect(api.count('GET', /^\/matches\//)).toBe(0);
});

test('canonicalises a lower-case match ID', async ({ page, api }) => {
  api.on('GET', MATCH, { body: fullMatch(0) });

  await page.goto('/en/matches/euw1_7000000000');
  await expect(page).toHaveURL('/en/matches/EUW1_7000000000');
  await expect(page.getByRole('table')).toHaveCount(2);
});

test('offers a retry when the match fails to load', async ({ page, api }) => {
  let failed = false;
  api.on('GET', MATCH, () => {
    if (failed) return { body: fullMatch(0) };
    failed = true;
    return { status: 429, body: { code: 'RATE_LIMITED' } };
  });

  await page.goto(MATCH_URL);
  await expect(page.getByRole('alert')).toContainText("Couldn't load this match");
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.getByRole('table')).toHaveCount(2);
});

test('starts the match page at the top when opened from far down the history', async ({
  page,
  api,
}) => {
  api.on('GET', MATCHES, { body: matchPage(0, 20, null) });
  api.on('GET', /^\/matches\/EUW1_6999999981$/, { body: fullMatch(19) });

  await page.goto('/en/players/euw1/Chamomile-EUW');
  const cards = page.getByRole('region', { name: 'Match history' }).getByRole('article');
  await expect(cards).toHaveCount(20);
  await cards.last().getByRole('link').click();

  await expect(page.getByRole('table')).toHaveCount(2);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
});

test.describe('mobile', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  const overflow = (page: import('@playwright/test').Page) =>
    page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );

  test('fits the scoreboard on a phone in Russian', async ({ page, api }) => {
    api.on('GET', MATCH, { body: fullMatch(0) });

    await page.goto(`/ru/matches/EUW1_7000000000?player=${PUUID}`);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Победа');
    const blue = page.getByRole('table', { name: 'Победа Синяя сторона' });
    await expect(blue.locator('tbody > tr.player-row')).toHaveCount(5);
    await expect(page.getByRole('table', { name: 'Поражение Красная сторона' })).toBeVisible();
    await expect(blue.locator('tfoot')).toContainText('Итого');
    await expect(page.getByRole('heading', { name: 'Комментарии' })).toBeVisible();

    const viewed = page.locator('tr[data-viewed]');
    await expect(viewed.getByText('Урон')).toBeVisible();
    await expect(viewed.getByRole('img', { name: 'Смертельная шляпа Рабадона' })).toBeVisible();
    expect(await overflow(page)).toBe(0);
  });

  test('fits Arena duos on a phone', async ({ page, api }) => {
    api.on('GET', MATCH, { body: fullArenaMatch(0) });

    await page.goto(`/ru/matches/EUW1_7000000000?player=${PUUID}`);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('2-е место');
    await expect(page.getByRole('table')).toHaveCount(8);
    expect(await overflow(page)).toBe(0);
  });
});
