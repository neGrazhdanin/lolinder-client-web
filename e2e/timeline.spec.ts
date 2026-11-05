import { fullArenaMatch, fullMatch, matchTimeline, PUUID } from './fixtures/data';
import { expect, notFound, test } from './fixtures/mock';

const MATCH = /^\/matches\/EUW1_7000000000$/;
const TIMELINE = /^\/matches\/EUW1_7000000000\/timeline$/;
const MATCH_URL = `/en/matches/EUW1_7000000000?player=${PUUID}`;

test('waits while Riot prepares the timeline, then shows it', async ({ page, api }) => {
  const match = fullMatch(0);
  let ready = false;
  api.on('GET', MATCH, { body: match });
  api.on('GET', TIMELINE, () => {
    if (ready) return { body: matchTimeline(match) };
    ready = true;
    return { status: 202, body: { status: 'pending' }, headers: { 'retry-after': '1' } };
  });

  await page.goto(MATCH_URL);
  const timeline = page.getByRole('region', { name: 'Timeline' });
  await expect(page.getByRole('table', { name: 'Victory Blue side' })).toBeVisible();
  await expect(timeline.getByRole('status')).toHaveText('Riot is preparing the timeline…');

  await expect(timeline.getByRole('img', { name: /^Gold difference/ })).toBeVisible();
  expect(api.count('GET', TIMELINE)).toBe(2);
  await expect(timeline.getByRole('status')).toHaveCount(0);

  const build = page.getByRole('region', { name: 'Build order' });
  await expect(build.getByRole('img', { name: "Doran's Ring", exact: true })).toBeVisible();
  await expect(build.getByRole('img', { name: "Sold Doran's Ring" })).toBeVisible();
  await expect(build.getByRole('img', { name: 'Health Potion' })).toHaveCount(0);
  await expect(build.getByText('0:03', { exact: true })).toBeVisible();

  const skills = page.getByRole('region', { name: 'Skill order' });
  await expect(skills.getByRole('table')).toBeVisible();
  await expect(skills.locator('tr[data-slot="4"] span.bg-primary')).toHaveCount(3);
  await expect(skills.getByText('Max order')).toBeVisible();
});

test('renders the scoreboard without waiting for the timeline', async ({ page, api }) => {
  api.on('GET', MATCH, { body: fullMatch(0) });
  api.on('GET', TIMELINE, () => new Promise(() => {}));

  await page.goto(MATCH_URL);
  await expect(page.getByRole('table', { name: 'Victory Blue side' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Timeline' }).getByRole('status')).toHaveText(
    'Loading the timeline',
  );
  await expect(page.getByRole('region', { name: 'Runes' })).toBeVisible();
});

test('expands another player with their runes, build and skills', async ({ page, api }) => {
  const match = fullMatch(0);
  api.on('GET', MATCH, { body: match });
  api.on('GET', TIMELINE, { body: matchTimeline(match) });

  await page.goto(MATCH_URL);
  const viewed = page.getByRole('button', { name: 'Details for Chamomile#EUW, Ahri' });
  await expect(viewed).toHaveAttribute('aria-expanded', 'true');
  await viewed.click();
  await expect(viewed).toHaveAttribute('aria-expanded', 'false');
  await expect(page.getByRole('region', { name: 'Build order' })).toHaveCount(0);

  await page.getByRole('row').filter({ hasText: 'Sencha' }).locator('td.c-gold').click();
  await expect(page.getByRole('button', { name: 'Details for Sencha#EUW, Sylas' })).toHaveAttribute(
    'aria-expanded',
    'true',
  );
  const build = page.getByRole('region', { name: 'Build order' });
  await expect(build.getByRole('img', { name: "Zhonya's Hourglass" })).toBeVisible();
  await expect(build.getByRole('img', { name: "Rabadon's Deathcap" })).toHaveCount(0);
  const skills = page.getByRole('region', { name: 'Skill order' });
  await expect(skills.locator('tr[data-slot="3"] td').first()).toContainText('1');

  const runes = page.getByRole('region', { name: 'Runes' });
  await expect(runes.getByRole('img', { name: 'Electrocute' })).toBeVisible();
  await expect(
    runes.getByRole('list', { name: 'Shards' }).getByRole('img', { name: 'Adaptive force' }),
  ).toHaveCount(2);
});

test('shows consumables and wards on request', async ({ page, api }) => {
  const match = fullMatch(0);
  api.on('GET', MATCH, { body: match });
  api.on('GET', TIMELINE, { body: matchTimeline(match) });

  await page.goto(MATCH_URL);
  const build = page.getByRole('region', { name: 'Build order' });
  await expect(build.getByRole('img', { name: 'Control Ward' })).toHaveCount(0);
  await build.getByRole('button', { name: 'Consumables and wards' }).click();
  await expect(build.getByRole('img', { name: 'Control Ward' })).toBeVisible();
  await expect(build.getByText('×2')).toBeVisible();
});

test('reads the gold lead from the keyboard', async ({ page, api }) => {
  const match = fullMatch(0);
  api.on('GET', MATCH, { body: match });
  api.on('GET', TIMELINE, { body: matchTimeline(match) });

  await page.goto(MATCH_URL);
  const chart = page.getByRole('img', { name: /^Gold difference/ });
  await chart.focus();
  await page.keyboard.press('Home');
  await expect(page.getByText(/^0:00: gold is even$/)).toBeAttached();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await expect(page.getByText(/^2:00: Blue side ahead by [\d,]+ gold$/)).toBeAttached();
  await page.keyboard.press('End');
  await expect(page.getByText(/^28:31: Red side ahead by [\d,]+ gold$/)).toBeAttached();
});

test('says calmly when Riot no longer has the timeline', async ({ page, api }) => {
  api.on('GET', MATCH, { body: fullMatch(0) });
  api.on('GET', TIMELINE, notFound('TIMELINE_UNAVAILABLE'));

  await page.goto(MATCH_URL);
  const timeline = page.getByRole('region', { name: 'Timeline' });
  await expect(timeline).toContainText('No timeline for this match');
  await expect(timeline.getByRole('alert')).toHaveCount(0);
  await expect(timeline.getByRole('button', { name: 'Try again' })).toHaveCount(0);
});

test('offers a retry when the timeline fails', async ({ page, api }) => {
  const match = fullMatch(0);
  let failed = false;
  api.on('GET', MATCH, { body: match });
  api.on('GET', TIMELINE, () => {
    if (failed) return { body: matchTimeline(match) };
    failed = true;
    return { status: 503, body: { code: 'SERVICE_UNAVAILABLE' } };
  });

  await page.goto(MATCH_URL);
  const timeline = page.getByRole('region', { name: 'Timeline' });
  await expect(timeline.getByRole('alert')).toContainText("Couldn't load the timeline");
  await timeline.getByRole('button', { name: 'Try again' }).click();
  await expect(timeline.getByRole('img', { name: /^Gold difference/ })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Build order' })).toBeVisible();
});

test('leaves out the gold chart in Arena but keeps the build', async ({ page, api }) => {
  const match = fullArenaMatch(0);
  api.on('GET', MATCH, { body: match });
  api.on('GET', TIMELINE, { body: matchTimeline(match) });

  await page.goto(MATCH_URL);
  await expect(page.getByRole('region', { name: 'Timeline' })).toHaveCount(0);
  await expect(page.getByRole('img', { name: /^Gold difference/ })).toHaveCount(0);
  await expect(page.getByRole('region', { name: 'Build order' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Skill order' }).getByRole('table')).toBeVisible();
  await expect(page.getByRole('region', { name: 'Runes' })).toHaveCount(0);
});

test.describe('mobile', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('fits the timeline on a phone in Russian', async ({ page, api }) => {
    const match = fullMatch(0);
    api.on('GET', MATCH, { body: match });
    api.on('GET', TIMELINE, { body: matchTimeline(match) });

    await page.goto(`/ru/matches/EUW1_7000000000?player=${PUUID}`);
    const timeline = page.getByRole('region', { name: 'Ход матча' });
    await expect(timeline.getByRole('img', { name: /^Разница в золоте/ })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Порядок покупок' })).toContainText('0:03');
    await expect(page.getByRole('img', { name: 'Продан: Кольцо Дорана' })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Порядок умений' })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Руны' })).toBeVisible();

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBe(0);
  });
});
