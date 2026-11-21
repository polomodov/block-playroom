import { expect, test } from '@playwright/test';

test.use({ serviceWorkers: 'block' });
test.skip(({ isMobile }) => isMobile, 'Keyboard shortcuts are for computers.');

test.afterEach(async ({ page }) => {
  expect((await page.pageErrors()).map((error) => error.message)).toEqual([]);
});

async function open(page, id) {
  await page.goto('./');
  await page.locator('[data-mode="' + id + '"]').click();
  await page.locator('#start-mode').click();
}

test('the robot console can be programmed from the keyboard', async ({ page }) => {
  await open(page, 'robot');
  await page.locator('.rb-stage canvas').click();
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowUp');
  await expect(page.locator('.rb-program button')).toHaveCount(3);
  await expect(page.locator('.rb-program button').nth(1)).toHaveAttribute('aria-label', '2. Налево');
  await page.keyboard.press('Backspace');
  await expect(page.locator('.rb-program button')).toHaveCount(2);
  await page.keyboard.press('Enter');
  await expect(page.locator('.rb-main')).not.toHaveText('Запуск');
});

test('arrow keys walk between the sockets of the bridge', async ({ page }) => {
  await open(page, 'bridge');
  const sockets = page.locator('.br-places button');
  await sockets.first().focus();
  const first = await page.evaluate(() => document.activeElement.getAttribute('aria-label'));
  await page.keyboard.press('ArrowRight');
  const second = await page.evaluate(() => document.activeElement.getAttribute('aria-label'));
  expect(second).not.toBe(first);
  await page.keyboard.press('ArrowLeft');
  await expect(sockets.first()).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(sockets.first()).toHaveAttribute('aria-pressed', 'true');
});
