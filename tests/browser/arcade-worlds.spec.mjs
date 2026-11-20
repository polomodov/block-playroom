import { expect, test } from '@playwright/test';

test.use({ serviceWorkers: 'block' });

const worlds = [
  ['temple', 'Храм изумруда'], ['arcade', 'Игровой центр'], ['waterpark', 'Аквапарк'],
  ['store', 'Мебельный магазин'], ['nether', 'Нижний мир'], ['castle', 'Замок на Хеллоуин'], ['end', 'Край'],
];
const heroes = ['kirill', 'maxim', 'mom', 'dad', 'pasha'];

for (const id of ['block-maze', 'block-jump', 'block-dash']) {
  test(id + ' запускает все семь миров с выбранным героем и его способностью', async ({ page, isMobile }) => {
    await page.goto('./games/' + id + '/');
    const levels = page.locator('input[name="level"]');
    await expect(levels).toHaveCount(7);
    for (const [index, [world, name]] of worlds.entries()) {
      const hero = heroes[index % heroes.length];
      for (const [group, value] of [['level', world], ['hero', hero]]) {
        const input = page.locator('input[name="' + group + '"][value="' + value + '"]');
        await page.locator('label').filter({ has: input }).click();
        await expect(input).toBeChecked();
      }
      await page.locator('#play').click();
      await expect(page.locator('#arena-title')).toHaveText(name);
      const ability = page.locator('#ability');
      if (isMobile) await ability.tap();
      else await ability.click();
      if (id === 'block-jump') await expect(ability).toHaveAttribute('aria-disabled', 'true');
      else await expect(ability).toBeDisabled();
      await page.locator('#pause').click();
      const saved = await page.evaluate((id) => JSON.parse(localStorage.getItem('family-games:/' + id + '/:progress:1')).saved, id);
      expect(saved).toMatchObject({ hero, level: world });
      expect((saved.progress ?? saved).cooldown).toBeGreaterThan(0);
      await page.locator(id === 'block-jump' ? '#back' : '#menu').click();
      await expect(page.locator('#lobby')).toBeVisible();
    }
    expect((await page.pageErrors()).map((error) => error.message)).toEqual([]);
  });
}
