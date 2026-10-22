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
  await page.getByRole('button', { name: 'Language' }).click();
  await page.getByRole('menuitemradio', { name: 'Русский' }).click();

  await expect(page).toHaveURL('/ru');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ru');

  await page.goto('/');
  await expect(page).toHaveURL('/ru');
});

test('applies dark theme without flashing on reload', async ({ page }) => {
  await page.goto('/en');
  await page.getByRole('button', { name: 'Theme' }).click();
  await page.getByRole('menuitemradio', { name: 'Dark' }).click();
  await expect(page.locator('html')).toHaveClass(/dark/);

  await page.reload({ waitUntil: 'commit' });
  await expect(page.locator('html')).toHaveClass(/dark/);
});

test('shows 404 inside the locale', async ({ page }) => {
  await page.goto('/en/no-such-page');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Page not found');
});

test('English pages contain no Cyrillic text', async ({ page }) => {
  for (const path of ['/en', '/en/no-such-page']) {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    expect(await page.locator('body').innerText()).not.toMatch(/[а-яё]/i);
  }
});
