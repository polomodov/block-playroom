import { expect, test } from '@playwright/test';
import { robotRoutes } from '../robot-routes.mjs';

test.use({ serviceWorkers: 'block' }); // The offline suite exercises installation separately.

test.afterEach(async ({ page }) => {
  expect((await page.pageErrors()).map((error) => error.message)).toEqual([]);
});

function controls(page, isMobile) {
  return async (selector, options) => {
    const button = typeof selector === 'string' ? page.locator(selector) : selector;
    if (isMobile) await button.tap(options);
    else await button.click(options);
  };
}

async function freezeGameClock(page) {
  await page.clock.install({ time: new Date('2025-01-01T10:00:00Z') });
  await page.clock.pauseAt(new Date('2025-01-01T10:00:01Z'));
}

async function openMode(page, press, id) {
  await page.goto('./');
  await press('[data-mode="' + id + '"]');
  const title = await page.locator('#mode-title').innerText();
  await press('#start-mode');
  await expect(page.locator('#game-title')).toHaveText(title);
  return title;
}

// Each marker is produced by the game's renderer. It must be present after the
// input and again in a newly mounted game after reloading the entire page.
const modes = [
  {
    id: 'coop',
    async play(press) {
      await press('[data-actor="1"]');
      await press('[data-dir="up"]');
    },
    marker: '[data-actor="1"][aria-pressed="true"]',
    payload: { active: 1, roomSteps: 1 },
  },
  {
    id: 'golf',
    play: (press) => press('.golf-hit'),
    marker: '.golf-turns',
    text: 'На лунке 1',
  },
  {
    id: 'mystery',
    async play(press) {
      await press('.case-cloak');
      await press('[data-room="0"]');
      await press('.case-search');
    },
    marker: '.case-count',
    text: '1/3',
    payload: { clues: 1 },
  },
  {
    id: 'rhythm',
    async play(press) {
      await press('.rh-action');
      await press('.rh-pads [aria-label^="До,"]');
    },
    marker: '.rh-sequence .rh-done',
    payload: { phase: 'play', progress: 1 },
  },
  {
    id: 'race',
    play: (press) => press('.race-go'),
    marker: '.race-clock',
    text: /[1-9]/,
    payload: { phase: 'run' },
  },
  {
    id: 'bridge',
    play: (press) => press('[data-part="deck"][data-joint="0"]'),
    marker: '[data-part="deck"][data-joint="0"][aria-pressed="true"]',
  },
  {
    id: 'tactics',
    play: (press) => press('[data-act="skill"]'),
    marker: '.tac-cue',
    text: 'Мама невидима',
    payload: { veil: [true, false] },
  },
  {
    id: 'cards',
    async play(press, page) {
      await press(page.getByRole('button', { name: /Папино «Бу!»/ }));
      await press(page.getByRole('button', { name: /Аккорд Паши/ }));
    },
    marker: '.deck-note',
    text: /танц/i,
    payload: { table: ['boo', 'guitar'] },
  },
  {
    id: 'cafe',
    async play(press) {
      await press('.cafe-next');
      await press('[data-stove="0"]');
      await press('[data-stove="0"][data-state="ready"]');
      await press('[data-order="0"]');
    },
    marker: '.cafe-hud',
    text: 'Гостей обслужено 1 / 3',
    payload: { sent: 1 },
  },
  {
    id: 'pinball',
    async play(press, page) {
      await page.locator('.pin-table select').selectOption('end');
      await press('.pin-launch');
    },
    marker: '.pin-title',
    text: 'Башня шалкера',
    payload: { table: 'end', launches: 1 },
  },
  {
    id: 'photo',
    async play(press, page) {
      const field = page.locator('.photo-field');
      await page.clock.runFor(2500);
      await expect(page.locator('.photo-status')).toContainText('Гаст заряжает');
      // The ghast charges slightly right of centre on the first pass.
      const { width, height } = await field.boundingBox();
      await press('.photo-field', {
        position: { x: Math.round(width * 0.73), y: Math.round(height * 0.51) },
      });
      await press('.photo-shutter');
    },
    marker: '.photo-prints figcaption',
    text: 'Гаст · Мама',
  },
  {
    id: 'robot',
    async play(press) {
      await press('[data-cmd="forward"]');
      await press('[data-cmd="right"]');
    },
    marker: '.rb-length',
    text: '2 /',
    payload: { program: ['forward', 'right'] },
  },
];

function readSlot(page, id) {
  return page.evaluate(
    (id) => JSON.parse(localStorage.getItem('family-games:/block-playroom/:progress:1')).slots[id],
    id,
  );
}
function expectMarker(page, { marker, text }) {
  const rendered = page.locator(marker);
  return text ? expect(rendered).toContainText(text) : expect(rendered).toBeVisible();
}

for (const mode of modes) {
  test(mode.id + ' — игровое действие и продолжение из общего меню', async ({ page, isMobile }) => {
    const press = controls(page, isMobile);
    // Hold the shutter window across layout and touch input, even on slow runners.
    if (mode.id === 'photo') await freezeGameClock(page);
    const title = await openMode(page, press, mode.id);
    await mode.play(press, page);
    await expectMarker(page, mode);
    await press('#pause-game');
    const saved = await readSlot(page, mode.id);
    expect(saved.payload).toBeTruthy();
    if (mode.payload) expect(saved.payload).toMatchObject(mode.payload);
    await press('#sheet-lobby');
    await page.reload();
    await expect(page.locator('#continue-saved')).toContainText(title);
    await press('#continue-saved');
    await expect(page.locator('#sheet-title')).toHaveText('Пауза');
    await expect(page.locator('#game-title')).toHaveText(title);
    const restored = await readSlot(page, mode.id);
    expect(restored.id).toBe(saved.id);
    expect(restored.payload).toEqual(saved.payload);
    await press('#sheet-action');
    await expectMarker(page, mode);
  });
}

const arcades = [
  {
    id: 'block-maze',
    hud: '#gems',
    async play(page, press, mobile) {
      if (mobile) await press('[data-dir="right"]');
      else await page.keyboard.press('ArrowRight');
    },
  },
  {
    id: 'block-jump',
    hud: '#cooldown',
    async play(page, press, mobile) {
      if (mobile) await press('#ability');
      else await page.keyboard.press('KeyE');
    },
  },
  {
    id: 'block-dash',
    hud: '#distance',
    async play(page, press, mobile) {
      if (mobile) await press('[data-action="right"]');
      else await page.keyboard.press('ArrowRight');
    },
  },
];

function arcadeSave(page, id) {
  return page.evaluate(
    (id) => JSON.parse(localStorage.getItem('family-games:/' + id + '/:progress:1')).saved,
    id,
  );
}

for (const arcade of arcades) {
  test(arcade.id + ' — вход и восстановление через игротеку', async ({ context, page, isMobile }) => {
    const original = await context.newPage();
    const play = controls(original, isMobile);
    await original.goto('./');
    await play('[data-game-link="' + arcade.id + '"]');
    await expect(original).toHaveURL(new RegExp('/games/' + arcade.id + '/$'));
    await play('#play');
    await expect(original.locator('#arena')).toBeVisible();
    await arcade.play(original, play, isMobile);
    const hud = original.locator(arcade.hud);
    await expect(hud).toHaveText(arcade.id === 'block-maze' ? /^[1-9]\d*\s*\// : /[1-9]/);
    await play('#pause');
    await expect(original.locator('#resume')).toBeVisible();
    const displayed = await hud.textContent();
    const { savedAt, ...checkpoint } = await arcadeSave(original, arcade.id);
    if (arcade.id === 'block-dash') expect(checkpoint.lane).toBe(1);
    await play('[data-collection-home]');
    await expect(original.locator('#continue-saved')).toBeVisible();
    const persisted = await arcadeSave(original, arcade.id);
    expect(persisted).toMatchObject(checkpoint);
    expect((await original.pageErrors()).map((error) => error.message)).toEqual([]);
    await original.close();

    // Open an independent document in the same browser profile. Check the stored
    // payload before any arcade code can restore or autosave it.
    const press = controls(page, isMobile);
    await page.goto('./');
    expect(await arcadeSave(page, arcade.id)).toEqual(persisted);
    await press('#continue-saved');
    await expect(page.locator('#arena')).toBeVisible();
    await expect(page.locator('#resume')).toBeVisible();
    await expect(page.locator(arcade.hud)).toHaveText(displayed);
    expect(await arcadeSave(page, arcade.id)).toMatchObject(checkpoint);
    await press('#resume');
    await expect(page.locator('#resume')).toBeHidden();
  });
}

test('доставка во всех семи залах записывает одну победу и освобождает сохранение', async ({
  page,
  isMobile,
}) => {
  const press = controls(page, isMobile);
  test.setTimeout(120_000);
  await openMode(page, press, 'robot');
  const commands = { f: 'forward', r: 'right', l: 'left', '[': 'loop', ']': 'end' };
  for (const [index, route] of robotRoutes.entries()) {
    const program = Array.from(route, (key) => commands[key]);
    const steps = route.replace(/\[([flr]+)\]/g, (_, group) => group.repeat(3));
    await expect(page.locator('.rb-game h2')).toContainText((index + 1) + '/' + robotRoutes.length);
    for (const cmd of program) await press('[data-cmd="' + cmd + '"]');
    // One press executes one instruction, including each iteration of a loop.
    for (let step = 0; step < steps.length; step++) {
      await press('.rb-step');
      if (index === 3 && step === 1) {
        await press('#go-lobby');
        await page.reload();
        await press('#continue-saved');
        await press('#sheet-action');
        await expect(page.locator('.rb-game h2')).toContainText('4/7');
      }
    }
    await expect(page.locator('.rb-status')).toHaveText('Все изумруды доставлены на станцию!');
    await expect(page.locator('.rb-main')).toHaveText(index === robotRoutes.length - 1 ? 'Завершить доставку' : 'Следующий зал');
    await press('.rb-main');
  }
  await expect(page.locator('#sheet-title')).toHaveText('Игра пройдена!');
  await press('#sheet-lobby');
  await page.reload();
  const results = page.locator('#game-history li');
  await expect(results).toHaveCount(1);
  await expect(results).toContainText(['Робот за изумрудом · Паша']);
  await expect(results).toContainText(['7 из 7']);
  await expect(page.locator('#continue-saved')).toBeHidden();
});
