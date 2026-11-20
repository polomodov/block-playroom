import { expect, test } from '@playwright/test';

test.use({ serviceWorkers: 'block' });

test('выбор двух героев обязателен для тактики и сохраняется при переключении игр', async ({ page }) => {
  await page.goto('./?game=tactics');
  const party = page.getByRole('group', { name: 'Герои' });
  const hero = (name) => party.getByRole('button', { name });
  const launch = page.locator('#start-mode');
  await expect(hero('Мама')).toHaveAttribute('aria-pressed', 'true');
  await hero('Мама').click();
  await expect(launch).toBeDisabled();
  await hero('Кирилл').click();
  await expect(launch).toBeEnabled();
  await page.locator('[data-mode="rhythm"]').click();
  await expect(party.getByRole('button')).toHaveCount(1);
  await expect(hero('Паша')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('[data-mode="tactics"]').click();
  await expect(hero('Кирилл')).toHaveAttribute('aria-pressed', 'true');
  await expect(hero('Паша')).toHaveAttribute('aria-pressed', 'true');
  await launch.click();
  await page.locator('#go-lobby').click();
  await expect(page.locator('#resume-mode')).toHaveText('Продолжить · Паша и Кирилл');
});

test('отмена перезапуска оставляет программу робота, подтверждение начинает чистую партию', async ({
  page,
}) => {
  await page.goto('./?game=robot');
  await page.locator('#start-mode').click();
  await page.locator('[data-cmd="forward"]').click();
  await page.locator('[data-cmd="right"]').click();
  const queue = page.getByRole('group', { name: 'Очередь команд' }).getByRole('button');
  await expect(queue).toHaveCount(2);
  await page.locator('#go-lobby').click();
  await page.locator('#start-mode').click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('Начать заново?');
  await dialog.getByRole('button', { name: 'Отмена' }).click();
  await page.reload();
  await page.locator('#continue-saved').click();
  await expect(dialog).toContainText('Пауза');
  await dialog.getByRole('button', { name: 'Продолжить' }).click();
  await expect(queue).toHaveCount(2);
  await page.locator('#go-lobby').click();
  await page.locator('#start-mode').click();
  await dialog.getByRole('button', { name: 'Начать', exact: true }).click();
  await expect(page.locator('.rb-game')).toBeVisible();
  await expect(queue).toHaveCount(0);
});
