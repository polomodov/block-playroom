import { expect, test } from '@playwright/test';

test.use({ serviceWorkers: 'block' });

// The maze and platformer start one input before their goals. The endless
// runner checkpoint is taken from an unsteered, seeded run just before its third hit.
function lastEmerald(page) {
  return page.evaluate(async () => {
    const { createGame } = await import('./games/block-maze/engine.js');
    const game = createGame('pasha', 'castle');
    game.start();
    const checkpoint = game.snapshot();
    const { x, y } = game.state.player;
    const gem = y * game.state.width + x + 1;
    if (!checkpoint.progress.gems.includes(gem)) throw new Error('No gem beside the start');
    checkpoint.progress.gems = [gem];
    return checkpoint;
  });
}

function lastFlag(page) {
  return page.evaluate(async () => {
    const { createRun: platformer } = await import('./games/block-jump/physics.js');
    const game = platformer('end', 'mom');
    const { flag } = game.state.level;
    const { player } = game.state;
    player.x = flag.x - player.w / 2 - 6;
    player.y = flag.y - player.h;
    return { ...game.snapshot(), id: 'end-flag' };
  });
}

function lastCollision(page) {
  return page.evaluate(async () => {
    const { createRun: runner } = await import('./games/block-dash/engine.js');
    const game = runner({ worldId: 'nether', heroId: 'maxim', seed: 27 });
    let checkpoint;
    while (game.state.status === 'playing' && game.state.time < 120) {
      checkpoint = game.snapshot();
      game.update(0.2);
    }
    if (game.state.status !== 'over' || checkpoint.lives !== 1) throw new Error('Expected the final collision');
    return checkpoint;
  });
}

const games = [
  { id: 'block-maze', checkpoint: lastEmerald, result: '#message-title', title: 'Замок пройден!',
    hero: 'Паша', outcome: 'Уровень пройден' },
  { id: 'block-jump', checkpoint: lastFlag, result: '#result-title', title: 'Край пройден!',
    hero: 'Мама', outcome: 'Уровень пройден' },
  { id: 'block-dash', checkpoint: lastCollision, result: '#run-title', title: 'Забег окончен',
    hero: 'Максим', outcome: 'Финиш забега' },
];

for (const game of games) {
  test(game.id + ' завершает восстановленную партию и сохраняет результат при повреждённой истории', async ({
    page, isMobile,
  }) => {
    const key = 'family-games:/' + game.id + '/:progress:1';
    await page.goto('./');
    await page.evaluate(({ key, check, brokenDate }) => {
      const old = { hero: 'dad', level: 'temple', gems: 2, outcome: 'lost', at: 1700000000000 };
      const results = [null, old];
      if (brokenDate) results.unshift({ ...old, at: 1e20 });
      localStorage.setItem(key, JSON.stringify({ saved: { ...check, savedAt: Date.now() }, results }));
    }, { key, check: await game.checkpoint(page), brokenDate: game.id !== 'block-jump' });
    await page.reload();
    await page.locator('#continue-saved').click();
    await expect(page.locator('#arena')).toBeVisible();
    await expect(page.locator(game.result)).toHaveText('Пауза');
    await page.locator('#resume').click();
    if (game.id === 'block-maze') {
      if (isMobile) await page.locator('[data-dir="right"]').tap();
      else await page.keyboard.press('ArrowRight');
    } else if (game.id === 'block-jump') {
      await page.keyboard.down('ArrowRight');
    }
    await expect(page.locator(game.result)).toHaveText(game.title);
    if (game.id === 'block-jump') await page.keyboard.up('ArrowRight');
    await page.locator('[data-collection-home]').click();
    await page.reload();
    await page.getByText('История всех игр', { exact: true }).click();
    const rows = page.locator('#game-history li');
    await expect(rows).toHaveCount(2);
    await expect(rows.first()).toContainText(game.hero);
    await expect(rows.first()).toContainText(game.outcome);
    await expect(rows.last()).toContainText('Папа');
    if (game.id === 'block-maze') {
      await page.locator('#continue-saved').click();
      await expect(page.locator('#arena-title')).toHaveText('Край');
      await expect(page.locator('#hero-name')).toHaveText('Паша');
      await expect(page.locator(game.result)).toHaveText('Пауза');
    } else {
      await expect(page.locator('#continue-saved')).toBeHidden();
    }
    expect((await page.pageErrors()).map((error) => error.message)).toEqual([]);
  });

  test(game.id + ' сохраняет новую партию после выхода из старой вкладки', async ({ page, context }) => {
    const gameUrl = './games/' + game.id + '/';
    const saveKey = 'family-games:/' + game.id + '/:progress:1';
    const snapshot = (p) => p.evaluate((key) => JSON.parse(localStorage.getItem(key)).saved, saveKey);
    await page.goto(gameUrl + '?hero=dad&level=temple');
    await page.locator('#play').click();
    await page.locator('#pause').click();
    await expect(page.locator(game.result)).toHaveText('Пауза');

    const newer = await context.newPage();
    await newer.goto(gameUrl + '?hero=mom&level=nether');
    await newer.locator('#play').click();
    await newer.locator('#pause').click();
    const checkpoint = await snapshot(newer);
    expect(checkpoint).toMatchObject({ hero: 'mom', level: 'nether' });
    await page.bringToFront();
    await page.locator('#resume').click();
    await page.locator('[data-collection-home]').click();
    await expect(page.locator('.catalog')).toBeVisible();
    expect(await snapshot(page)).toEqual(checkpoint);
    await newer.close();
    await page.locator('#continue-saved').click();
    await expect(page.locator(game.result)).toHaveText('Пауза');
    await expect(page.locator('#arena-title')).toHaveText('Нижний мир');
    await expect(page).toHaveURL(/hero=mom/);
  });
}
