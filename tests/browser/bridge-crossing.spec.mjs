import { createHash } from 'node:crypto';
import { expect, test } from '@playwright/test';

test.use({ serviceWorkers: 'block' });

// Count the steel body of the cart in the ravine. A failure label alone used
// to appear while the cart stayed perched on the unbroken deck.
function cartBelowDeck(canvas) {
  return canvas.evaluate((el) => {
    const y = Math.floor(el.height * 0.65);
    const { data } = el.getContext('2d').getImageData(0, y, el.width, el.height - y);
    let pixels = 0;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] === 0x42 && data[i + 1] === 0x53 && data[i + 2] === 0x63) pixels++;
    }
    return pixels;
  });
}

async function frameHash(canvas) {
  return createHash('sha256').update(await canvas.evaluate((el) => el.toDataURL())).digest('hex');
}

test('настил без опоры ломается, а тот же чертёж с одной опорой выдерживает вагонетку', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.clock.install();
  await page.goto('./?game=bridge');
  await page.locator('#start-mode').click();
  const bridge = page.locator('.br-game');
  const board = bridge.locator('.br-board');
  const canvas = board.locator('canvas');
  const decks = bridge.getByRole('button', { name: /^Настил \d+$/ });
  const posts = bridge.getByRole('button', { name: /^Опора \d+$/ });
  const launch = bridge.getByRole('button', { name: 'Пустить вагонетку' });
  const status = bridge.getByRole('status');

  await expect(decks).toHaveCount(3);
  for (const deck of await decks.all()) await deck.click();
  await expect(posts.and(bridge.locator('[aria-pressed="true"]'))).toHaveCount(0);
  const baseline = await cartBelowDeck(canvas);
  await launch.click();
  await expect(board).toHaveAttribute('data-phase', 'broken');
  await expect(board).toHaveAttribute('data-collapse', 'settled');
  await expect(bridge.locator('.br-meter')).toHaveAttribute('data-state', 'overload');
  await expect(status).toContainText(/настил|прол[её]т/i);
  expect(await cartBelowDeck(canvas)).toBeGreaterThan(baseline + 80);
  const afterFall = await frameHash(canvas);
  await page.clock.runFor(350);
  expect(await frameHash(canvas)).toBe(afterFall);

  await bridge.getByRole('button', { name: 'Вернуться к чертежу' }).click();
  await expect(decks.and(bridge.locator('[aria-pressed="true"]'))).toHaveCount(3);
  await expect(posts.and(bridge.locator('[aria-pressed="true"]'))).toHaveCount(0);
  expect(await cartBelowDeck(canvas)).toBe(baseline);
  await bridge.getByRole('button', { name: 'Опора 1' }).click();
  await launch.click();
  await expect(board).toHaveAttribute('data-phase', 'passed', { timeout: 12_000 });
  await expect(status).toContainText('Мост выдержал');
  await expect(bridge.getByRole('button', { name: 'Следующая переправа' })).toBeEnabled();
});
