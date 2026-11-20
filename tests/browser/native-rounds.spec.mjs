import { expect, test } from '@playwright/test';

test.use({ serviceWorkers: 'block' });

test('кафе показывает гостя и рецепт новой смены, даже когда на старом столе остался заказ', async ({ page }) => {
  await page.goto('./?game=cafe');
  await page.evaluate(async () => {
    const { saveSlot } = await import('./progress.js');
    const { newCafe } = await import('./cafe.js');
    const shift = {
      ...newCafe(),
      phase: 'open',
      time: 24.5,
      orders: ['waiting', 'served', 'served', 'waiting'],
      sent: 2,
      tray: [2, 0, 0],
    };
    saveSlot({ id: 'breakfast', mode: 'cafe', players: ['mom'] }, shift);
  });
  await page.reload();
  await page.locator('#resume-mode').click();
  await page.locator('#sheet-action').click();
  const first = page.locator('.cafe-ticket[data-order="0"]');
  await expect(first).toContainText('Скелет');
  await page.locator('.cafe-ticket[data-order="3"]').click();
  await page.getByRole('button', { name: 'Следующая смена' }).click();
  await expect(first).toContainText('Паук');
  await expect(first).toContainText('блин + лимонад');
  await expect(first.locator('progress')).toHaveAttribute('max', '29');
});

test('пропущенные кадры экрана не пропускают демонстрацию мелодии', async ({ page }) => {
  const date = new Date('2026-01-01T08:00:00');
  await page.clock.install({ time: date });
  await page.clock.pauseAt(new Date(+date + 1000));
  await page.goto('./?game=rhythm');
  await page.locator('#start-mode').click();
  await page.getByRole('button', { name: 'Начать репетицию' }).click();
  await page.clock.runFor(100);
  await page.clock.fastForward(7000);
  await expect(page.locator('.rhythm-stage')).toHaveAttribute('data-phase', 'listen');
  for (const index of [0, 1, 2]) {
    const untilBeat = index === 0 ? 500 : 640;
    await page.clock.runFor(untilBeat);
    await expect(page.locator('.rh-sequence span').nth(index)).toHaveClass(/rh-now/);
  }
  await page.clock.runFor(1100);
  await expect(page.locator('.rhythm-stage')).toHaveAttribute('data-phase', 'play');
});

test('детектив выбирает одно из семи дел и продолжает поиск в том же мире после перезапуска', async ({ page }) => {
  await page.goto('./?game=mystery');
  await page.locator('#start-mode').click();
  const picker = page.getByLabel('Выбери дело');
  await expect(picker.locator('option')).toHaveCount(7);
  const headers = new Set();
  for (let level = 0; level < 7; level++) {
    await picker.selectOption(String(level));
    headers.add(await page.locator('.case-banner h2').innerText());
  }
  expect(headers.size).toBe(7);
  await expect(page.locator('.case-banner h2')).toHaveText('След у портала');
  await expect(page.locator('[data-room="4"]')).toBeDisabled();
  await page.locator('[data-room="6"]').click();
  await page.locator('.case-search').click();
  await expect(page.locator('.case-count')).toHaveText('Улики 1/3');
  await expect(picker).toBeDisabled();
  await page.locator('#go-lobby').click();
  await page.reload();
  await page.locator('#continue-saved').click();
  await page.locator('#sheet-action').click();
  await expect(picker).toHaveValue('6');
  await expect(page.locator('.case-notes')).toContainText('штамп');
  await expect(page.locator('.case-location')).toContainText('Хранилище');
});

test('можно выбрать каждую из семи сцен концерта и начать новую мелодию', async ({ page }) => {
  await page.goto('./?game=rhythm');
  await page.locator('#start-mode').click();
  const picker = page.getByLabel('Мелодия');
  await expect(picker.locator('option')).toHaveCount(7);
  const titles = new Set();
  for (const song of ['temple', 'arcade', 'store', 'nether', 'end', 'waterpark', 'castle']) {
    await picker.selectOption(song);
    titles.add(await page.locator('.rh-song').innerText());
  }
  expect(titles.size).toBe(7);
  await page.getByRole('button', { name: 'Начать репетицию' }).click();
  await expect(page.locator('.rh-world')).toHaveText('Замок на Хеллоуин');
  await expect(page.locator('.rh-cue')).toContainText('Ведьма');
  expect(await page.pageErrors()).toEqual([]);
});
