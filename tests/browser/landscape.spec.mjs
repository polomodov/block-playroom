import { expect, test } from '@playwright/test';

// A phone held sideways (iPhone 13 in landscape, Safari toolbars hidden).
test.use({ viewport: { width: 750, height: 342 }, hasTouch: true, serviceWorkers: 'block' });

test.afterEach(async ({ page }) => {
  expect((await page.pageErrors()).map((error) => error.message)).toEqual([]);
});

// The playing field and the control a player needs most must both be on screen
// without scrolling. Turn-based panels beside the field may scroll on their own.
const library = [
  { id: 'coop', field: '.coop-stage canvas', control: '[data-dir="up"]' },
  { id: 'golf', field: 'canvas', control: '.golf-hit' },
  { id: 'rhythm', field: '.rh-band', control: '.rh-action' },
  { id: 'race', field: '.race-track', control: '.race-go' },
  { id: 'bridge', field: '.br-board', control: '.br-go' },
  { id: 'tactics', field: '.tac-board', control: '.tac-cell.reachable' },
  { id: 'cafe', field: '.cafe-stations', control: '.cafe-next' },
  { id: 'cards', field: '.deck-lanes', control: '.deck-handline button' },
  { id: 'pinball', field: '.pin-field', control: '.pin-controls button' },
  { id: 'photo', field: '.photo-field', control: '.photo-shutter' },
  { id: 'robot', field: '.rb-stage', control: '.rb-inputs button' },
];
const arcades = ['block-maze', 'block-jump', 'block-dash'];

async function expectOnScreen(page, selector) {
  const box = await page.locator(selector).first().boundingBox();
  expect(box, selector).not.toBeNull();
  expect(box.y, selector + ' top').toBeGreaterThanOrEqual(0);
  expect(box.y + box.height, selector + ' bottom').toBeLessThanOrEqual(342 + 1);
  expect(box.x + box.width, selector + ' right').toBeLessThanOrEqual(750 + 1);
}

for (const game of library) {
  test(game.id + ' fits a phone held sideways', async ({ page }) => {
    await page.goto('./');
    await page.locator('[data-mode="' + game.id + '"]').click();
    await page.locator('#start-mode').click();
    await page.evaluate(() => window.scrollTo(0, 0));
    if (game.field === 'canvas') {
      // Golf draws several canvases. The course is the largest one.
      const sizes = await page.locator('#arena canvas').evaluateAll((list) =>
        list.map((c) => c.getBoundingClientRect().width * c.getBoundingClientRect().height));
      await expectOnScreen(page, '#arena canvas >> nth=' + sizes.indexOf(Math.max(...sizes)));
    } else await expectOnScreen(page, game.field);
    await expectOnScreen(page, game.control);
  });
}

for (const name of arcades) {
  test(name + ' fits a phone held sideways', async ({ page }) => {
    await page.goto('games/' + name + '/?hero=kirill&level=temple');
    await page.locator('#play').click();
    await page.evaluate(() => window.scrollTo(0, 0));
    const largest = await page.locator('canvas').evaluateAll((list) => {
      const visible = list.map((c, i) => [c.getBoundingClientRect(), i]).filter(([r]) => r.width > 0);
      visible.sort((a, b) => b[0].width * b[0].height - a[0].width * a[0].height);
      return visible[0][1];
    });
    await expectOnScreen(page, 'canvas >> nth=' + largest);
  });
}
