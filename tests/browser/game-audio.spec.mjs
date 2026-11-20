import { test, expect } from '@playwright/test';

test.use({ serviceWorkers: 'block' });

test('звук робота включается по нажатию и общий переключатель работает в аркаде', async ({ page }) => {
  await page.addInitScript(() => {
    window.playedNotes = 0;
    const start = OscillatorNode.prototype.start;
    OscillatorNode.prototype.start = function (...args) {
      window.playedNotes++;
      return start.apply(this, args);
    };
  });
  await page.goto('./?game=robot');
  const lobby = page.locator('#lobby-sound');
  await expect(lobby).toHaveAttribute('aria-pressed', 'false');
  await page.locator('#start-mode').click();
  const key = page.locator('.rb-inputs button').first();
  await key.click();
  expect(await page.evaluate(() => window.playedNotes)).toBe(0);

  await page.locator('#game-sound').click();
  const running = () => page.evaluate(async () => Boolean((await import('./game-audio.js')).gameAudio.instrument()));
  await expect.poll(running).toBe(true);
  await key.click();
  expect(await page.evaluate(() => window.playedNotes)).toBe(2);

  await page.locator('#go-lobby').click();
  await expect(lobby).toHaveAttribute('aria-pressed', 'true');
  await page.locator('[data-game-link="block-jump"]').click();
  await expect(page.locator('#sound')).toHaveAttribute('aria-pressed', 'true');
  // The embedded game keeps its original speaker icon when bound to the collection setting.
  await expect(page.locator('#sound svg')).toHaveCount(1);
  await page.locator('#sound').click();
  await page.locator('[data-collection-home]').click();
  await expect(lobby).toHaveAttribute('aria-pressed', 'false');
});
