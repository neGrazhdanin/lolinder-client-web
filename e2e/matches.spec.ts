import { arenaMatch, historyMatch, IDLE, matchPage, PUUID, player, profile } from './fixtures/data';
import { expect, test } from './fixtures/mock';

const SEARCH = /^\/players\/search$/;
const PROFILE = new RegExp(`^/players/${PUUID}$`);
const MATCHES = new RegExp(`^/players/${PUUID}/matches$`);
const PROFILE_URL = '/en/players/euw1/Chamomile-EUW';

test.beforeEach(({ api }) => {
  api.on('GET', SEARCH, { body: player });
  api.on('GET', PROFILE, { body: profile });
});

test('loads the first games of a new player when the worker reports them', async ({
  page,
  api,
  realtime,
}) => {
  api.on('GET', MATCHES, {
    body: { items: [], nextCursor: null, loading: { newest: true, older: false } },
  });

  await page.goto(PROFILE_URL);
  const history = page.getByRole('region', { name: 'Match history' });
  await expect(history.getByText('Loading games from Riot')).toBeVisible();
  await expect(history.getByRole('article')).toHaveCount(0);
  await expect.poll(() => realtime.rooms.has(PUUID)).toBe(true);

  api.on('GET', MATCHES, { body: matchPage(0, 3, null) });
  realtime.matchesUpdated(PUUID);

  await expect(history.getByRole('article')).toHaveCount(3);
  const latest = history.getByRole('article').first();
  await expect(latest).toHaveAccessibleName('Victory Ahri');
  await expect(latest).toContainText('Ranked Solo/Duo');
  await expect(latest).toContainText('28:31');
  await expect(latest.getByRole('list', { name: 'Items' }).getByRole('img')).toHaveCount(4);
  await expect(latest.getByRole('img', { name: "Rabadon's Deathcap" })).toBeVisible();
  await expect(latest.getByRole('img', { name: 'Electrocute' })).toBeVisible();
  await expect(latest.getByRole('img', { name: 'Flash' })).toBeVisible();
  await expect(history.getByText('Loading games from Riot')).toHaveCount(0);
});

test('loads older pages with the cursor until the history ends', async ({ page, api }) => {
  const cursors: (string | null)[] = [];
  api.on('GET', MATCHES, ({ url }) => {
    const cursor = url.searchParams.get('cursor');
    cursors.push(cursor);
    return { body: cursor === 'c1' ? matchPage(20, 5, null) : matchPage(0, 20, 'c1') };
  });

  await page.goto(PROFILE_URL);
  const history = page.getByRole('region', { name: 'Match history' });
  await expect(history.getByRole('article')).toHaveCount(20);
  await expect(history.getByText('Last 20')).toBeVisible();

  await history.getByRole('button', { name: 'Load more games' }).click();
  await expect(history.getByRole('article')).toHaveCount(25);
  await expect(history.getByText('No older games')).toBeVisible();
  await expect(history.getByRole('button', { name: 'Load more games' })).toHaveCount(0);
  expect(cursors).toEqual([null, 'c1']);
});

test('filters the history by game mode', async ({ page, api }) => {
  const queues: (string | null)[] = [];
  api.on('GET', MATCHES, ({ url }) => {
    const queue = url.searchParams.get('queue');
    queues.push(queue);
    return {
      body: queue === 'aram' ? matchPage(0, 2, null, { queueId: 450 }) : matchPage(0, 6, null),
    };
  });

  await page.goto(PROFILE_URL);
  const history = page.getByRole('region', { name: 'Match history' });
  await expect(history.getByRole('article')).toHaveCount(6);

  const modes = history.getByRole('group', { name: 'Game mode' });
  await modes.getByRole('button', { name: 'ARAM' }).click();
  await expect(history.getByRole('article')).toHaveCount(2);
  await expect(history.getByRole('article').first()).toContainText('ARAM');

  await modes.getByRole('button', { name: 'All' }).click();
  await expect(history.getByRole('article')).toHaveCount(6);
  expect(queues).toEqual([null, 'aram']);
});

test('offers all modes when a filter has no games', async ({ page, api }) => {
  api.on('GET', MATCHES, ({ url }) => ({
    body:
      url.searchParams.get('queue') === 'arena'
        ? { items: [], nextCursor: null, loading: IDLE }
        : matchPage(0, 4, null),
  }));

  await page.goto(PROFILE_URL);
  const history = page.getByRole('region', { name: 'Match history' });
  await history
    .getByRole('group', { name: 'Game mode' })
    .getByRole('button', { name: 'Arena' })
    .click();
  await expect(history.getByText('No games in this mode')).toBeVisible();

  await history.getByRole('button', { name: 'Show all modes' }).click();
  await expect(history.getByRole('article')).toHaveCount(4);
});

test('waits at the bottom while older games load and continues after the event', async ({
  page,
  api,
  realtime,
}) => {
  let olderLoaded = false;
  api.on('GET', MATCHES, ({ url }) => {
    const cursor = url.searchParams.get('cursor');
    if (!cursor) return { body: matchPage(0, 20, olderLoaded ? 'c1-after' : 'c1') };
    if (cursor === 'c1') {
      return { body: { items: [], nextCursor: null, loading: { newest: false, older: true } } };
    }
    return { body: matchPage(20, 20, 'c2') };
  });

  await page.goto(PROFILE_URL);
  const history = page.getByRole('region', { name: 'Match history' });
  await expect(history.getByRole('article')).toHaveCount(20);
  await expect.poll(() => realtime.rooms.has(PUUID)).toBe(true);

  await history.getByRole('button', { name: 'Load more games' }).click();
  const waiting = history.getByRole('status').filter({ hasText: 'Loading older games' });
  await expect(waiting).toBeVisible();
  await expect(history.getByRole('button', { name: 'Load more games' })).toHaveCount(0);

  olderLoaded = true;
  realtime.matchesUpdated(PUUID);

  await expect(history.getByRole('article')).toHaveCount(40);
  await expect(waiting).toHaveCount(0);
  await expect(history.getByRole('button', { name: 'Load more games' })).toBeVisible();
});

test('refreshes the list when the profile sync finishes', async ({ page, api, realtime }) => {
  api.on('GET', MATCHES, { body: matchPage(1, 3, null) });

  await page.goto(PROFILE_URL);
  const history = page.getByRole('region', { name: 'Match history' });
  await expect(history.getByRole('article')).toHaveCount(3);
  await expect.poll(() => realtime.rooms.has(PUUID)).toBe(true);

  api.on('GET', MATCHES, {
    body: {
      items: [historyMatch(0), ...matchPage(1, 3, null).items],
      nextCursor: null,
      loading: IDLE,
    },
  });
  realtime.playerUpdated(PUUID);
  await expect(history.getByRole('article')).toHaveCount(4);
});

test('shows the new games coming in at the top', async ({ page, api, realtime }) => {
  api.on('GET', MATCHES, {
    body: { ...matchPage(1, 2, null), loading: { newest: true, older: false } },
  });

  await page.goto(PROFILE_URL);
  const history = page.getByRole('region', { name: 'Match history' });
  await expect(history.getByRole('status')).toHaveText('Checking for new games');
  await expect(history.getByRole('article')).toHaveCount(2);
  await expect(history.getByText('No older games')).toBeVisible();
  await expect.poll(() => realtime.rooms.has(PUUID)).toBe(true);

  api.on('GET', MATCHES, {
    body: {
      items: [historyMatch(0), ...matchPage(1, 2, null).items],
      nextCursor: null,
      loading: IDLE,
    },
  });
  realtime.matchesUpdated(PUUID);
  await expect(history.getByRole('article')).toHaveCount(3);
  await expect(history.getByText('Checking for new games')).toHaveCount(0);
});

test('shows the Arena finish and groups players by duo', async ({ page, api }) => {
  api.on('GET', MATCHES, {
    body: { items: [arenaMatch(0, 2), arenaMatch(1, 7)], nextCursor: null, loading: IDLE },
  });

  await page.goto(PROFILE_URL);
  const history = page.getByRole('region', { name: 'Match history' });
  const [second, seventh] = [
    history.getByRole('article').nth(0),
    history.getByRole('article').nth(1),
  ];
  await expect(second).toHaveAccessibleName('2nd Ahri');
  await expect(second).toContainText('Arena');
  await expect(seventh).toHaveAccessibleName('7th Ahri');
  await expect(second.getByRole('list', { name: /^Team \d$/ })).toHaveCount(8);
});

test('offers a retry when the history fails to load', async ({ page, api }) => {
  let failed = false;
  api.on('GET', MATCHES, () => {
    if (failed) return { body: matchPage(0, 2, null) };
    failed = true;
    return { status: 400, body: { code: 'VALIDATION_FAILED' } };
  });

  await page.goto(PROFILE_URL);
  const history = page.getByRole('region', { name: 'Match history' });
  await expect(history.getByRole('alert')).toContainText("Couldn't load the match history");
  await history.getByRole('button', { name: 'Try again' }).click();
  await expect(history.getByRole('article')).toHaveCount(2);
});

test.describe('mobile', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('fits match cards on a phone in Russian', async ({ page, api }) => {
    api.on('GET', MATCHES, {
      body: {
        items: [...matchPage(0, 3, null).items, arenaMatch(3, 2)],
        nextCursor: null,
        loading: IDLE,
      },
    });

    await page.goto('/ru/players/euw1/Chamomile-EUW');
    const history = page.getByRole('region', { name: 'История матчей' });
    await expect(history.getByRole('article')).toHaveCount(4);
    await expect(history.getByRole('article').first()).toContainText('Победа');
    await expect(history.getByRole('article').last()).toContainText('2-е место');

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBe(0);
  });
});
