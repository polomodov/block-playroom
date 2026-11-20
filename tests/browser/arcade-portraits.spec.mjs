import { expect, test } from '@playwright/test';

test.use({ serviceWorkers: 'block' });

async function picture(banner) {
  return banner.evaluate(async (canvas) => {
    // Hash only the rendered illustration. Labels and checked radio buttons are outside the canvas.
    const thumbnail = document.createElement('canvas');
    thumbnail.width = 128;
    thumbnail.height = 64;
    const ctx = thumbnail.getContext('2d');
    ctx.drawImage(canvas, 0, 0, thumbnail.width, thumbnail.height);
    const { data } = ctx.getImageData(0, 0, thumbnail.width, thumbnail.height);
    if (!data.some((value, i) => i % 4 === 3 && value !== 0)) return null;
    const digest = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
  });
}

async function nextPicture(banner, previous = null) {
  let drawn;
  await expect
    .poll(
      async () => {
        drawn = await picture(banner);
        return drawn !== null && drawn !== previous;
      },
      { message: 'Ожидали новую нарисованную обложку' },
    )
    .toBe(true);
  return drawn;
}

for (const game of ['block-jump', 'block-dash']) {
  test(game + ' перерисовывает обложку при выборе героя и мира', async ({ page }) => {
    await page.goto('./games/' + game + '/?hero=dad&level=temple');
    const banner = page.locator('.classic-arcade-cover');
    const select = async (group, id) => {
      const input = page.locator('input[name="' + group + '"][value="' + id + '"]');
      await page.locator('label').filter({ has: input }).click();
      await expect(input).toBeChecked();
    };
    await page.evaluate(() => document.fonts.ready);
    await nextPicture(banner);
    await select('hero', 'kirill');
    const kirillInTemple = await nextPicture(banner);

    await select('hero', 'pasha');
    const pashaInTemple = await nextPicture(banner, kirillInTemple);
    await select('level', 'waterpark');
    await nextPicture(banner, pashaInTemple);

    await select('level', 'temple');
    await expect.poll(() => picture(banner)).toBe(pashaInTemple);
    await select('hero', 'kirill');
    await expect.poll(() => picture(banner)).toBe(kirillInTemple);
  });
}
