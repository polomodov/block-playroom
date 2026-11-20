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

test('старая вкладка при выходе не перезаписывает новую партию робота', async ({ page, context }) => {
  await page.goto('./?game=robot');
  await page.locator('#start-mode').click();
  await page.locator('[data-cmd="left"]').click();

  const next = await context.newPage();
  await next.goto('./?game=robot');
  await next.locator('#start-mode').click();
  await next.getByRole('dialog').getByRole('button', { name: 'Начать', exact: true }).click();
  await next.locator('[data-cmd="forward"]').click();
  await next.locator('#go-lobby').click();
  // Closing or pausing the older game writes a final checkpoint.
  await page.locator('#go-lobby').click();
  await next.reload();
  await next.locator('#resume-mode').click();
  await next.getByRole('button', { name: 'Продолжить', exact: true }).click();
  const commands = next.getByRole('group', { name: 'Очередь команд' }).getByRole('button');
  await expect(commands).toHaveCount(1);
  await expect(commands.first()).toHaveAttribute('aria-label', '1. Шаг');
});
