import { expect, test } from '@playwright/test';

test.use({ serviceWorkers: 'block' });

test('семь снимков появляются в альбоме и завершают экспедицию', async ({ page }) => {
  test.setTimeout(120_000);
  const start = new Date('2026-01-01T10:00:00Z');
  await page.clock.install({ time: start });
  await page.clock.pauseAt(new Date(+start + 1000));
  await page.goto('./?game=photo');
  await page.locator('#start-mode').click();
  const field = page.locator('.photo-field');
  const assignments = await page.evaluate(async () => (await import('./photo.js')).assignments);
  for (const [index, assignment] of assignments.entries()) {
    const [begin, end] = assignment.window || [2, 4.3];
    const time = (begin + end) / 2;
    await page.clock.runFor(time * 1000);
    await expect(page.locator('.photo-status')).toHaveText(assignment.action);
    const animal = await page.evaluate(async ([i, t]) => (await import('./photo.js')).wildlife(i, t), [index, time]);
    const area = await field.boundingBox();
    await field.click({ position: { x: animal.x * area.width / 800, y: animal.y * area.height / 340 } });
    await page.locator('.photo-shutter').click();
    await expect(page.locator('.photo-prints figure')).toHaveCount(index + 1);
    await page.locator('.photo-shutter').click();
  }
  await expect(page.locator('#sheet-copy')).toContainText('21 из 21');
  await page.locator('#sheet-lobby').click();
  await expect(page.locator('#game-history li')).toContainText(['21 из 21']);
});
