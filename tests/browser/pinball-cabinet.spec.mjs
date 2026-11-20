import { expect, test } from '@playwright/test';

test.use({ serviceWorkers: 'block' });

test('удержание пружины меняет скорость подачи, а перезапуск сохраняет партию', async ({ page }) => {
  const tick = new Date('2026-11-20T12:00:00Z');
  await page.clock.install({ time: tick });
  await page.clock.pauseAt(new Date(+tick + 1000));
  await page.goto('./?game=pinball');
  await page.locator('#start-mode').click();
  await page.locator('.pin-table select').selectOption('aqua');
  await page.locator('.pin-launch').focus();
  await page.keyboard.down('Space');
  await page.clock.runFor(600);
  await expect(page.locator('.pin-launch')).toHaveText(/7[45]%/);
  await page.keyboard.up('Space');
  await expect(page.locator('.pin-game')).toHaveAttribute('data-phase', 'play');
  await page.clock.runFor(1400);
  await expect(page.locator('.pin-score')).not.toHaveText('0');

  await page.locator('#pause-game').click();
  const saved = await page.evaluate(async () => (await import('./progress.js')).slot('pinball').payload);
  expect(saved.power).toBeGreaterThanOrEqual(74);
  expect(saved.lastSkillTick).toBeGreaterThan(0);
  await page.reload();
  await page.locator('#continue-saved').click();
  await expect(page.locator('#sheet-title')).toHaveText('Пауза');
  await expect(page.locator('.pin-score')).toHaveText(new Intl.NumberFormat('ru-RU').format(saved.score));
  await page.locator('#sheet-action').click();
  await expect(page.locator('.pin-title')).toHaveText('Тайфун');
});

test('рекорд завершённой партии относится к её столу и читается после перезапуска', async ({ page }) => {
  await page.goto('./?game=pinball');
  await page.evaluate(async () => {
    const { newPinball, launchPinball } = await import('./pinball.js');
    const { saveSlot } = await import('./progress.js');
    const s = newPinball('kirill', 'end');
    launchPinball(s);
    Object.assign(s, { score: 862, balls: 1, ball: { x: 184, y: 485, vx: 0, vy: 220 } });
    saveSlot({ id: 'final-pinball', mode: 'pinball', players: ['kirill'] }, s);
  });
  await page.reload();
  await page.locator('#continue-saved').click();
  await page.locator('#sheet-action').click();
  await expect(page.locator('#sheet-copy')).toContainText('Новый рекорд!');
  await page.locator('#sheet-lobby').click();
  await page.reload();
  await page.locator('#start-mode').click();
  await expect(page.locator('.pin-best')).toHaveText('0');
  await page.locator('.pin-table select').selectOption('end');
  await expect(page.locator('.pin-best')).toHaveText('862');
});
