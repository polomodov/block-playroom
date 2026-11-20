import { expect, test } from '@playwright/test';

test.use({ serviceWorkers: 'block' });

for (const game of ['block-maze', 'block-jump', 'block-dash']) {
  test(game + ' играет соло Паши с нужной доли после паузы и сохраняет выключение звука', async ({ page }) => {
    await page.addInitScript(() => {
      window.riff = { starts: [], stops: 0 };
      const prototype = AudioBufferSourceNode.prototype;
      const start = prototype.start, stop = prototype.stop;
      prototype.start = function (...args) {
        if (this.buffer?.duration === 5) window.riff.starts.push(args[1] ?? 0);
        return start.apply(this, args);
      };
      prototype.stop = function (...args) {
        if (this.buffer?.duration === 5) window.riff.stops++;
        return stop.apply(this, args);
      };
    });
    await page.goto('games/' + game + '/?hero=pasha');
    const sound = page.locator('#sound');
    await expect(sound).toHaveAttribute('aria-pressed', 'false');
    await sound.click();
    await page.locator('#play').click();
    await page.locator('#ability').dispatchEvent('click', { detail: 0 });
    await expect.poll(() => page.evaluate(() => window.riff.starts.length)).toBe(1);
    await page.locator('#pause').click();
    expect(await page.evaluate(() => window.riff.stops)).toBe(1);
    await page.locator('#resume').click();
    await expect.poll(() => page.evaluate(() => window.riff.starts.length)).toBe(2);
    const [initial, resumed] = await page.evaluate(() => window.riff.starts);
    expect(initial).toBeLessThan(.15);
    expect(resumed).toBeGreaterThan(0);
    await page.goto('games/' + game + '/?hero=pasha');
    await expect(sound).toHaveAttribute('aria-pressed', 'true');
    await sound.click();
    await page.reload();
    await expect(sound).toHaveAttribute('aria-pressed', 'false');
  });
}
