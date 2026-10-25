import { expect, test } from '@playwright/test';

test('redirects root to the browser locale', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL('/en');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Find a player');
});

test.describe('with Russian browser', () => {
  test.use({ locale: 'ru-RU' });

  test('redirects root to /ru', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL('/ru');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Найти игрока');
  });
});

test('switches locale and remembers the choice', async ({ page }) => {
  await page.goto('/en');
  await page.getByRole('button', { name: 'Русский' }).click();

  await expect(page).toHaveURL('/ru');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ru');

  await page.getByRole('button', { name: 'Русский' }).click();
  await expect(page.getByRole('button', { name: 'Русский' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );

  await page.goto('/');
  await expect(page).toHaveURL('/ru');
});

test.describe('theme', () => {
  test.use({ colorScheme: 'light' });

  test('follows the system theme until toggled', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/en');
    await expect(page.locator('html')).toHaveClass(/dark/);
  });

  test('toggles and keeps the choice without flashing on reload', async ({ page }) => {
    await page.goto('/en');
    await expect(page.locator('html')).not.toHaveClass(/dark/);

    await page.getByRole('button', { name: 'Toggle theme' }).click();
    await expect(page.locator('html')).toHaveClass(/dark/);

    await page.reload({ waitUntil: 'commit' });
    await expect(page.locator('html')).toHaveClass(/dark/);

    await page.getByRole('button', { name: 'Toggle theme' }).click();
    await expect(page.locator('html')).not.toHaveClass(/dark/);
  });
});

test('navigates between sections', async ({ page }) => {
  await page.goto('/en');
  const nav = page.getByRole('navigation', { name: 'Sections' });

  await nav.getByRole('link', { name: 'Builds' }).click();
  await expect(page).toHaveURL('/en/builds');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Coming soon');

  await nav.getByRole('link', { name: 'Stats' }).click();
  await expect(page).toHaveURL('/en');
});

test('shows 404 inside the locale', async ({ page }) => {
  await page.goto('/en/no-such-page');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Page not found');
});

test('English pages contain no Cyrillic text', async ({ page }) => {
  for (const path of ['/en', '/en/duo', '/en/no-such-page']) {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    expect(await page.locator('body').innerText()).not.toMatch(/[а-яё]/i);
  }
});

test.describe('mobile', () => {
  test.use({ viewport: { width: 375, height: 740 } });

  test('tab bar reaches every section', async ({ page }) => {
    await page.goto('/en');
    const tabs = page.getByRole('navigation', { name: 'Sections' });

    for (const [name, path] of [
      ['Builds', '/en/builds'],
      ['Duo', '/en/duo'],
      ['Flex', '/en/flex'],
      ['Stats', '/en'],
    ] as const) {
      await tabs.getByRole('link', { name }).click();
      await expect(page).toHaveURL(path);
      await expect(tabs.getByRole('link', { name })).toHaveAttribute('aria-current', 'page');
    }
  });

  test('search opens from the header', async ({ page }) => {
    // the home page has its own search, so the header one starts on other pages
    await page.goto('/en/builds');
    await expect(page.getByRole('searchbox', { name: 'Player search' })).toBeHidden();

    await page.getByRole('button', { name: 'Open search' }).click();
    await expect(page.getByRole('searchbox', { name: 'Player search' })).toBeVisible();

    await page.getByRole('button', { name: 'Close search' }).click();
    await expect(page.getByRole('searchbox', { name: 'Player search' })).toBeHidden();
  });

  test('header keeps language and theme controls without horizontal scroll', async ({ page }) => {
    await page.goto('/en');
    await expect(page.getByRole('group', { name: 'Language' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Toggle theme' })).toBeVisible();

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBe(0);
  });
});
