import { PUUID, player, profile, rankHistory, withSync } from './fixtures/data';
import { expect, notFound, test } from './fixtures/mock';

const SEARCH = /^\/players\/search$/;
const PROFILE = new RegExp(`^/players/${PUUID}$`);
const REFRESH = new RegExp(`^/players/${PUUID}/refresh$`);
const HISTORY = new RegExp(`^/players/${PUUID}/rank-history$`);
const PROFILE_URL = '/en/players/euw1/Chamomile-EUW';

test.describe('search', () => {
  test('finds a player by Riot ID and opens the profile', async ({ page, api }) => {
    api.on('GET', SEARCH, ({ url }) => {
      expect(Object.fromEntries(url.searchParams)).toEqual({
        platform: 'euw1',
        gameName: 'Chamomile',
        tagLine: 'EUW',
      });
      return { body: player };
    });
    api.on('GET', PROFILE, { body: profile });

    await page.goto('/en');
    await page.getByLabel('Riot ID').fill('  Chamomile # EUW ');
    await page.getByRole('button', { name: 'Search', exact: true }).click();

    await expect(page).toHaveURL(PROFILE_URL);
    await expect(page).toHaveTitle('Chamomile#EUW · lolinder');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Chamomile');

    const solo = page.getByRole('article', { name: 'Ranked Solo/Duo' });
    await expect(solo).toContainText('Emerald II');
    await expect(solo).toContainText('36 LP to Emerald I');
    await expect(solo.getByRole('meter')).toHaveAttribute('aria-valuenow', '64');
    await expect(page.getByRole('article', { name: 'Ranked Flex' })).toContainText('Gold I');
    await expect(page.getByRole('region', { name: 'Top champions' })).toContainText('Ahri');

    await page.getByRole('link', { name: 'lolinder' }).click();
    const recent = page.getByRole('region', { name: 'Recently viewed' });
    await recent.getByRole('link', { name: /Chamomile\s*#EUW/ }).click();
    await expect(page).toHaveURL(PROFILE_URL);
  });

  test('switches the region before searching', async ({ page, api }) => {
    api.on('GET', SEARCH, { body: { ...player, platform: 'kr' } });
    api.on('GET', PROFILE, { body: { ...profile, platform: 'kr' } });

    await page.goto('/en');
    await page.getByRole('combobox', { name: 'Region' }).click();
    await page.getByRole('option', { name: /Korea/ }).click();
    await page.getByLabel('Riot ID').fill('Chamomile#EUW');
    await page.getByLabel('Riot ID').press('Enter');

    await expect(page).toHaveURL('/en/players/kr/Chamomile-EUW');
  });

  test('explains a Riot ID without a tag instead of searching', async ({ page, api }) => {
    await page.goto('/en');
    await page.getByLabel('Riot ID').fill('Chamomile');
    await page.getByRole('button', { name: 'Search', exact: true }).click();

    await expect(page.getByRole('alert')).toHaveText('Add the tag after #, like Name#EUW');
    await expect(page.getByLabel('Riot ID')).toHaveAttribute('aria-invalid', 'true');
    expect(api.count('GET', SEARCH)).toBe(0);
  });

  test('shows a not-found state with other regions to try', async ({ page, api }) => {
    api.on('GET', SEARCH, notFound('PLAYER_NOT_FOUND'));

    await page.goto('/en/players/euw1/Nobody-404');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('No player Nobody#404 on EUW');
    await expect(page.getByLabel('Riot ID')).toHaveValue('Nobody#404');

    await page
      .getByRole('navigation', { name: 'Try another region' })
      .getByRole('link', { name: 'NA' })
      .click();
    await expect(page).toHaveURL('/en/players/na1/Nobody-404');
  });

  test('repeats the search while the API answers 202', async ({ page, api }) => {
    let attempts = 0;
    api.on('GET', SEARCH, () =>
      ++attempts < 3
        ? { status: 202, body: { status: 'pending' }, headers: { 'retry-after': '1' } }
        : { body: player },
    );
    api.on('GET', PROFILE, { body: profile });

    await page.goto(PROFILE_URL);
    await expect(page.getByRole('status').first()).toContainText('Looking up Chamomile#EUW on EUW');
    await expect(page.getByText('Riot is taking a while to answer')).toBeVisible();

    await expect(page.getByRole('article', { name: 'Ranked Solo/Duo' })).toContainText(
      'Emerald II',
    );
    expect(attempts).toBe(3);
  });

  test('canonicalises the Riot ID casing in the URL', async ({ page, api }) => {
    api.on('GET', SEARCH, { body: player });
    api.on('GET', PROFILE, { body: profile });

    await page.goto('/en/players/euw1/chamomile-euw');
    await expect(page).toHaveURL(PROFILE_URL);
    expect(api.count('GET', SEARCH)).toBe(1);
  });
});

test.describe('LP history', () => {
  test('draws the graph and switches queues', async ({ page, api }) => {
    api.on('GET', SEARCH, { body: player });
    api.on('GET', PROFILE, { body: profile });
    api.on('GET', HISTORY, ({ url }) => ({
      body: rankHistory(url.searchParams.get('queue') === 'flex' ? 'flex' : 'solo'),
    }));

    await page.goto(PROFILE_URL);
    await expect(page.getByRole('img', { name: 'LP graph, Ranked Solo/Duo' })).toBeVisible();

    await page.getByRole('group', { name: 'Queue' }).getByRole('button', { name: 'Flex' }).click();
    await expect(page.getByRole('img', { name: 'LP graph, Ranked Flex' })).toBeVisible();
    expect(api.count('GET', HISTORY)).toBe(2);
  });

  test('explains an empty history instead of drawing nothing', async ({ page, api }) => {
    api.on('GET', SEARCH, { body: player });
    api.on('GET', PROFILE, { body: profile });
    api.on('GET', HISTORY, { body: { items: [] } });

    await page.goto(PROFILE_URL);
    await expect(page.getByText('No LP history yet')).toBeVisible();
  });
});

test.describe('live updates', () => {
  test('shows cached data while syncing and refetches on player:updated', async ({
    page,
    api,
    realtime,
  }) => {
    api.on('GET', SEARCH, { body: player });
    api.on('GET', PROFILE, { body: withSync(profile, 'syncing') });

    await page.goto(PROFILE_URL);
    const solo = page.getByRole('article', { name: 'Ranked Solo/Duo' });
    await expect(solo).toContainText('Emerald II');
    await expect(page.getByText('Updating from Riot')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Updating' })).toBeDisabled();
    await expect.poll(() => realtime.rooms.has(PUUID)).toBe(true);

    const promoted = {
      ...profile,
      sync: { status: 'fresh' as const, lastSyncedAt: new Date().toISOString() },
      ranks: [{ ...profile.ranks[0]!, division: 'I' as const, leaguePoints: 3 }],
    };
    api.on('GET', PROFILE, { body: promoted });
    const profileCalls = api.count('GET', PROFILE);
    realtime.playerUpdated(PUUID);

    await expect(solo).toContainText('Emerald I');
    await expect(page.getByText(/^Updated /)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Refresh' })).toBeEnabled();
    expect(api.count('GET', PROFILE)).toBe(profileCalls + 1);
  });

  test('ignores updates for other players', async ({ page, api, realtime }) => {
    api.on('GET', SEARCH, { body: player });
    api.on('GET', PROFILE, { body: withSync(profile, 'syncing') });

    await page.goto(PROFILE_URL);
    await expect.poll(() => realtime.rooms.has(PUUID)).toBe(true);
    const profileCalls = api.count('GET', PROFILE);

    // socket messages arrive in order, so once our own update has refetched, the other one had its chance
    realtime.playerUpdated('someone-else'.padEnd(78, '0'));
    realtime.playerUpdated(PUUID);
    await expect.poll(() => api.count('GET', PROFILE)).toBe(profileCalls + 1);
    await expect(page.getByRole('article', { name: 'Ranked Solo/Duo' })).toBeVisible();
    expect(api.count('GET', PROFILE)).toBe(profileCalls + 1);
  });

  test('refresh queues a sync and settles when the update arrives', async ({
    page,
    api,
    realtime,
  }) => {
    api.on('GET', SEARCH, { body: player });
    api.on('GET', PROFILE, { body: profile });
    api.on('POST', REFRESH, { body: withSync(profile, 'syncing') });

    await page.goto(PROFILE_URL);
    await page.getByRole('button', { name: 'Refresh' }).click();

    await expect(page.getByText('Updating from Riot')).toBeVisible();
    expect(api.count('POST', REFRESH)).toBe(1);

    api.on('GET', PROFILE, {
      body: { ...profile, sync: { status: 'fresh', lastSyncedAt: new Date().toISOString() } },
    });
    await expect.poll(() => realtime.rooms.has(PUUID)).toBe(true);
    realtime.playerUpdated(PUUID);

    await expect(page.getByText('Updated now')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Refresh' })).toBeEnabled();
  });

  test('says so when a refresh lands inside the cooldown', async ({ page, api }) => {
    api.on('GET', SEARCH, { body: player });
    api.on('GET', PROFILE, { body: profile });
    api.on('POST', REFRESH, { body: profile });

    await page.goto(PROFILE_URL);
    await page.getByRole('button', { name: 'Refresh' }).click();
    await expect(page.getByText('Already up to date')).toBeVisible();
  });
});

test.describe('first sync', () => {
  test('shows placeholders instead of "Unranked" before data arrives', async ({ page, api }) => {
    const fresh = { ...player, sync: { status: 'syncing' as const, lastSyncedAt: null } };
    api.on('GET', SEARCH, { body: fresh });
    api.on('GET', PROFILE, { body: { ...fresh, ranks: [], topMasteries: [] } });

    await page.goto(PROFILE_URL);
    await expect(page.getByText('Loading from Riot')).toBeVisible();
    await expect(page.getByText('Unranked')).toHaveCount(0);
  });
});

test.describe('in Russian', () => {
  test.use({ locale: 'ru-RU' });

  test('uses Russian tier and champion names', async ({ page, api }) => {
    api.on('GET', SEARCH, { body: player });
    api.on('GET', PROFILE, { body: profile });

    await page.goto('/ru/players/euw1/Chamomile-EUW');
    await expect(page.getByRole('article', { name: 'Рейтинговая Соло/Дуо' })).toContainText(
      'Изумруд II',
    );
    await expect(page.getByRole('region', { name: 'Лучшие чемпионы' })).toContainText('Ари');
  });
});

test('English profile contains no Cyrillic text', async ({ page, api }) => {
  api.on('GET', SEARCH, { body: player });
  api.on('GET', PROFILE, { body: profile });

  await page.goto(PROFILE_URL);
  await expect(page.getByRole('region', { name: 'Top champions' })).toContainText('Ahri');
  expect(await page.locator('body').innerText()).not.toMatch(/[а-яё]/i);
});

test.describe('mobile', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('searches from the header and fits the profile on screen', async ({ page, api }) => {
    api.on('GET', SEARCH, { body: player });
    api.on('GET', PROFILE, { body: profile });

    await page.goto('/en/builds');
    await page.getByRole('button', { name: 'Open search' }).click();
    const search = page.getByRole('searchbox', { name: 'Player search' });
    await search.fill('Chamomile#EUW');
    await search.press('Enter');

    await expect(page).toHaveURL(PROFILE_URL);
    await expect(page.getByRole('button', { name: 'Refresh' })).toBeInViewport();

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBe(0);

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const tabBar = await page.getByRole('navigation', { name: 'Sections' }).boundingBox();
    const footer = await page.getByRole('contentinfo').boundingBox();
    expect(footer!.y + footer!.height).toBeLessThanOrEqual(tabBar!.y + 1);
  });
});

test.describe('player page routing', () => {
  test('sends an uppercase locale and platform to the lowercase URL', async ({ page, api }) => {
    api.on('GET', SEARCH, { body: player });
    api.on('GET', PROFILE, { body: profile });

    await page.goto('/EN/players/EUW1/Chamomile-EUW');
    await expect(page).toHaveURL(PROFILE_URL);
    await expect(page.getByRole('article', { name: 'Ranked Solo/Duo' })).toContainText(
      'Emerald II',
    );
  });

  test('explains a link without a Riot ID', async ({ page }) => {
    await page.goto('/en/players/euw1/Chamomile');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      "This link doesn't contain a Riot ID",
    );
  });

  test('opens a cached player at its canonical URL and focuses the result', async ({
    page,
    api,
  }) => {
    api.on('GET', SEARCH, { body: player });
    api.on('GET', PROFILE, { body: profile });
    await page.goto(PROFILE_URL);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Chamomile');

    await page.getByRole('link', { name: 'lolinder' }).click();
    await page.getByLabel('Riot ID').fill('chamomile#euw');
    await page.getByLabel('Riot ID').press('Enter');

    await expect(page).toHaveURL(PROFILE_URL);
    await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
    expect(api.count('GET', SEARCH)).toBe(1);
  });

  test('stops repeating a pending search after leaving the page', async ({ page, api }) => {
    api.on('GET', SEARCH, {
      status: 202,
      body: { status: 'pending' },
      headers: { 'retry-after': '1' },
    });
    await page.goto(PROFILE_URL);
    await expect(page.getByText('Riot is taking a while to answer')).toBeVisible();

    await page.getByRole('link', { name: 'lolinder' }).click();
    // A retry is due a second after each 202; none may arrive once the page is gone.
    const late = await page
      .waitForRequest((request) => new URL(request.url()).pathname === '/players/search', {
        timeout: 2500,
      })
      .catch(() => null);
    expect(late).toBeNull();
  });

  test('offers a retry when the lookup fails', async ({ page, api }) => {
    let failed = false;
    api.on('GET', SEARCH, () => {
      if (failed) return { body: player };
      failed = true;
      return { status: 500, body: { code: 'INTERNAL_ERROR' } };
    });
    api.on('GET', PROFILE, { body: profile });

    await page.goto(PROFILE_URL);
    await page.getByRole('button', { name: 'Try again' }).click();
    await expect(page.getByRole('article', { name: 'Ranked Solo/Duo' })).toContainText(
      'Emerald II',
    );
  });

  test('switches the language on a player page without looking the player up again', async ({
    page,
    api,
  }) => {
    api.on('GET', SEARCH, { body: player });
    api.on('GET', PROFILE, { body: profile });
    api.on('GET', HISTORY, { body: rankHistory('solo') });
    await page.goto(PROFILE_URL);
    await expect(page.getByText('Ahri')).toBeVisible();

    await page.getByRole('button', { name: 'Русский' }).click();

    await expect(page).toHaveURL('/ru/players/euw1/Chamomile-EUW');
    await expect(page.getByText('Ари')).toBeVisible();
    expect(api.count('GET', SEARCH)).toBe(1);
    expect(api.count('GET', PROFILE)).toBe(1);
  });
});

test.describe('profile details', () => {
  test('keeps the chosen queue when its toggle is clicked again', async ({ page, api }) => {
    api.on('GET', SEARCH, { body: player });
    api.on('GET', PROFILE, { body: profile });
    api.on('GET', HISTORY, ({ url }) => ({
      body: rankHistory(url.searchParams.get('queue') === 'flex' ? 'flex' : 'solo'),
    }));
    await page.goto(PROFILE_URL);

    const flex = page.getByRole('group', { name: 'Queue' }).getByRole('button', { name: 'Flex' });
    await flex.click();
    await expect(page.getByRole('img', { name: 'LP graph, Ranked Flex' })).toBeVisible();
    await flex.click();
    await expect(page.getByRole('img', { name: 'LP graph, Ranked Flex' })).toBeVisible();
  });

  test('names a champion the static data does not know yet', async ({ page, api }) => {
    api.on('GET', SEARCH, { body: player });
    api.on('GET', PROFILE, {
      body: {
        ...profile,
        topMasteries: [
          { championId: 999, level: 1, points: 900, lastPlayedAt: profile.sync.lastSyncedAt },
        ],
      },
    });
    await page.goto(PROFILE_URL);
    await expect(page.getByText('Champion #999')).toBeVisible();
  });

  test('fits a 320px screen in Russian without scrolling sideways', async ({ page, api }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    api.on('GET', SEARCH, { body: player });
    api.on('GET', PROFILE, { body: profile });
    api.on('GET', HISTORY, { body: rankHistory('solo') });

    await page.goto('/ru/players/euw1/Chamomile-EUW');
    await expect(page.getByText('Ари')).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBe(0);
  });
});
