import { expect, test } from '@playwright/test';

test.use({ serviceWorkers: 'block' });

test.afterEach(async ({ page }) => {
  expect((await page.pageErrors()).map((error) => error.message)).toEqual([]);
});

test('the catalog filter narrows the covers and is remembered on this device', async ({ page }) => {
  await page.goto('./');
  const covers = page.locator('.catalog .cover-card:visible');
  await expect(covers).toHaveCount(15);
  await page.locator('[data-filter="together"]').click();
  await expect(covers).toHaveCount(4);
  await expect(page.locator('[data-filter="together"]')).toHaveAttribute('aria-pressed', 'true');
  // The selected game (Два ключа) plays together, so its setup stays open next to it.
  await expect(page.locator('#setup')).toBeVisible();
  await page.locator('[data-filter="puzzle"]').click();
  await expect(covers).toHaveCount(6);
  await page.locator('[data-mode="robot"]').click();
  await expect(page.locator('#mode-title')).toHaveText('Робот за изумрудом');
  await page.locator('[data-filter="arcade"]').click();
  await expect(covers).toHaveCount(8);
  await expect(page.locator('#setup')).toBeHidden();
  await page.goto('./');
  await expect(covers).toHaveCount(8);
  // Pinball is an arcade game, so a link to it keeps the remembered filter.
  await page.goto('./?game=pinball');
  await expect(covers).toHaveCount(8);
  // A link to a game outside the filter shows the whole catalog so that game is never hidden.
  await page.goto('./?game=bridge');
  await expect(covers).toHaveCount(15);
  await expect(page.locator('#mode-title')).toHaveText('Мост над лавой');
  await page.locator('[data-filter="all"]').click();
  await expect(covers).toHaveCount(15);
});
