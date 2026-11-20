import { expect, test } from '@playwright/test';

test.use({ serviceWorkers: 'block' });

test.beforeEach(async ({ page }) => {
  const time = new Date('2026-06-01T09:00:00Z');
  await page.clock.install({ time });
  await page.clock.pauseAt(new Date(+time + 1000));
  await page.goto('./');
  await page.evaluate(() => {
    window.heard = [];
    window.mountGame = (game, saved) => {
      const host = document.createElement('section');
      document.body.append(host);
      window.round = game.mount(host, {
        saved,
        players: ['pasha', 'kirill'],
        cue: (id) => window.heard.push(id),
        finish: () => window.heard.push('finished'),
        save() {},
      });
      return host;
    };
  });
});

test('концерт после восстановления играет следующую ноту точно по фразе', async ({ page }) => {
  await page.evaluate(async () => {
    const game = await import('./rhythm.js');
    const state = game.createRhythm();
    game.listen(state);
    // Middle of the decay of the first C; the following D falls at 2 beats.
    state.elapsed = 60 / game.songs[0].bpm + 0.02;
    window.mountGame(game, state);
  });
  await page.clock.runFor(100);
  expect(await page.evaluate(() => window.heard)).toEqual([]);
  await page.evaluate(() => window.round.pause());
  await page.clock.runFor(1500);
  expect(await page.evaluate(() => window.heard)).toEqual([]);
  await page.evaluate(() => window.round.resume());
  await page.clock.runFor(630);
  expect(await page.evaluate(() => window.heard)).toEqual(['rhythm-d']);
  await page.clock.runFor(660);
  expect(await page.evaluate(() => window.heard)).toEqual(['rhythm-d', 'rhythm-c']);
});

test('последний шар пинбола даёт один сигнал потери перед завершением партии', async ({ page }) => {
  await page.evaluate(async () => {
    const game = await import('./pinball.js');
    const state = game.newPinball('pasha');
    game.launchPinball(state);
    state.balls = 1;
    state.ball = { x: 185, y: 485, vx: 0, vy: 220 };
    window.mountGame(game, state);
  });
  await page.clock.runFor(500);
  expect(await page.evaluate(() => window.heard)).toEqual(['pin-drain', 'finished']);
});

test('кафе озвучивает готовность блюда и выдачу один раз', async ({ page }) => {
  await page.evaluate(async () => {
    const game = await import('./cafe.js');
    const host = window.mountGame(game, null);
    host.querySelector('.cafe-next').click();
    const iron = host.querySelector('.cafe-stations button');
    iron.click();
    iron.click(); // Too early to remove it.
  });
  expect(await page.evaluate(() => window.heard)).toEqual(['cafe-iron']);
  await page.clock.runFor(4000);
  await page.evaluate(() => {
    document.querySelector('.cafe-stations button').click();
    document.querySelector('.cafe-ticket[data-order="0"]').click();
  });
  expect(await page.evaluate(() => window.heard)).toEqual(['cafe-iron', 'cafe-ready', 'cafe-plate', 'cafe-serve']);
});

test('разгонная площадка звучит в момент пересечения и один раз за проезд', async ({ page }) => {
  await page.evaluate(async () => {
    const game = await import('./race.js');
    const state = game.newRace('pasha');
    const pad = game.courses[state.course].pads[0];
    Object.assign(state, { phase: 'run', s: pad.s - 1, speed: 90, side: pad.side });
    window.mountGame(game, state);
  });
  await page.clock.runFor(400);
  expect(await page.evaluate(() => window.heard)).toEqual(['race-boost']);
});

test('карта гитары Паши звучит при розыгрыше, выбор цели остаётся тихим', async ({ page }) => {
  const heard = await page.evaluate(async () => {
    const game = await import('./cards.js');
    const state = game.createCards('pasha', 16);
    const host = window.mountGame(game, state);
    host.querySelector('[data-aim]').click();
    host.querySelector('[data-play="' + state.hand.indexOf('guitar') + '"]').click();
    return window.heard;
  });
  expect(heard).toEqual(['hero-strum']);
});

test('в тактике выбор героя тихий, слышны рывок Кирилла и шаг', async ({ page }) => {
  const heard = await page.evaluate(async () => {
    const game = await import('./tactics.js');
    const host = window.mountGame(game, null);
    host.querySelector('[data-pick="1"]').click();
    host.querySelector('[data-act="skill"]').click();
    host.querySelector('.tac-cell.reachable:not(:has(.tac-gem))').click();
    return window.heard;
  });
  expect(heard).toEqual(['tactics-kirill', 'tactics-step']);
});
