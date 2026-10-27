import { expect, test } from '@playwright/test';

test('swaps the poro when it is petted, by click or keyboard', async ({ page }) => {
  await page.goto('/en');
  const poro = page.getByRole('button', { name: 'Pet the poro' });
  await expect(poro).toBeVisible();

  const first = await poro.getAttribute('data-poro');
  await poro.click();
  await expect(poro).not.toHaveAttribute('data-poro', first!);

  const second = await poro.getAttribute('data-poro');
  await poro.press('Enter');
  await expect(poro).not.toHaveAttribute('data-poro', second!);
});

test.describe('in Russian', () => {
  test.use({ locale: 'ru-RU' });

  test('labels the poro in Russian', async ({ page }) => {
    await page.goto('/ru');
    await expect(page.getByRole('button', { name: 'Погладить поро' })).toBeVisible();
  });
});
