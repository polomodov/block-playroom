import { expect, test } from '@playwright/test';

test.use({ serviceWorkers: 'block' });

for (const [id, selector, last, title, start] of [
  ['race', '.race-course select', 'end', 'Орбита Края', '.race-go'],
  ['pinball', '.pin-table select', 'castle', 'Ведьмины часы', '.pin-launch'],
]) {
  test(id + ' сохраняет выбранное игровое поле при выходе из партии', async ({ page }) => {
    await page.goto('./?game=' + id);
    await page.locator('#start-mode').click();
    const picker = page.locator(selector);
    const choices = await picker
      .locator('option')
      .evaluateAll((options) => options.map((option) => option.value));
    expect(new Set(choices).size).toBe(7);
    for (const value of choices) {
      await picker.selectOption(value);
      await expect(picker).toHaveValue(value);
    }
    await picker.selectOption(last);
    await page.locator(start).click();
    await expect(picker).toBeDisabled();
    await page.locator('#go-lobby').click();
    await page.reload();
    await page.locator('#continue-saved').click();
    await expect(page.locator('#sheet-title')).toHaveText('Пауза');
    await expect(picker).toHaveValue(last);
    await expect(page.locator('[id="arena"] h2')).toHaveText(title);
    await page.locator('#sheet-action').click();
    await expect(picker).toBeDisabled();
    expect((await page.pageErrors()).map((error) => error.message)).toEqual([]);
  });
}

test('выбор семи миссий и рывок Кирилла с клавиатуры', async ({ page }) => {
  await page.goto('./?game=tactics');
  for (const hero of ['mom', 'pasha', 'kirill', 'maxim'])
    await page.locator('[data-hero="' + hero + '"]').click();
  await page.locator('#start-mode').click();
  const mission = page.locator('.tac-mission select');
  await expect(mission.locator('option')).toHaveCount(7);
  await mission.selectOption('6');
  await expect(page.locator('.tac-banner h2')).toHaveText('Четыре дозора');
  await mission.selectOption('0');
  await page.keyboard.press('e');
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('[data-cell="1"]')).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('[data-cell="1"]')).toBeFocused();
  await expect(page.locator('[data-cell="0"]')).toHaveAccessibleName(/Кирилл/);
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-cell="2"]')).toHaveAccessibleName(/Кирилл/);
  await expect(page.locator('.tac-team [aria-pressed="true"]')).toContainText('Максим');
  expect((await page.pageErrors()).map((error) => error.message)).toEqual([]);
});
