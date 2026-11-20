import { expect, test } from '@playwright/test';

test.use({ serviceWorkers: 'block' });

// An ordinary seven-room playthrough of Maxim's deck with shuffle seed 27.
// Numbers choose a card from the current hand; aim counts guards from the left of the original formation.
const aim = (number) => ({ target: number });
const end = 'end';
const route = [
  ['Храм изумруда', [3, aim(2), 3, end, 2, 1, 1], 'echo'],
  ['Аквапарк', [1, aim(2), 1, aim(3), 1, 1, end, 5], 'echo'],
  ['Край', [1, 2, 1, 1, end, 2, 2, 3, end, 3, 1], 'echo'],
  ['Игровой центр', [1, aim(3), 1, aim(1), 1, end, 1, aim(2), 1, 1], 'wave'],
  ['Мебельный магазин', [1, 4, 2, end, 1, 2, 1], 'echo'],
  ['Нижний мир', [1, 4, aim(2), 2, 1, end, 5, 1, end, 1], 'echo'],
  ['Замок на Хеллоуин', [1, 1, 2, end, 4, 2]],
];

test('семь порталов дают шесть наград и ровно одну итоговую запись', async ({ page, isMobile }) => {
  await page.addInitScript(() => { Math.random = () => 27 / 4294967296; });
  await page.goto('./?game=cards');
  await page.locator('#start-mode').click();
  const game = page.locator('.deck-game');
  const press = (button) => isMobile ? button.tap() : button.click();
  for (const [i, [world, moves, reward]] of route.entries()) {
    await expect(game.locator('header small')).toHaveText(world + ' · Портал ' + (i + 1) + ' из 7');
    for (const move of moves) {
      const selector = move === end ? '[data-end]' :
        typeof move === 'number' ? '[data-play="' + (move - 1) + '"]' : '[data-aim="' + (move.target - 1) + '"]';
      await press(game.locator(selector));
    }
    if (reward) {
      await expect(page.locator('#sheet')).toBeHidden();
      await press(game.locator('[data-reward="' + reward + '"]'));
    }
  }
  await expect(page.locator('#sheet-title')).toHaveText('Игра пройдена!');
  await page.locator('#sheet-lobby').click();
  await page.reload();
  await expect(page.locator('#continue-saved')).toBeHidden();
  await page.getByText('История всех игр', { exact: true }).click();
  const rows = page.locator('#game-history li');
  await expect(rows).toHaveCount(1);
  await expect(rows).toContainText(['Колода порталов · Максим']);
  await expect(rows).toContainText(['Открыто порталов 7']);
  await expect(rows).toContainText(['карт в колоде 15']);
});
