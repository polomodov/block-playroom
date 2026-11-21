import { test, expect } from '@playwright/test';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runInNewContext } from 'node:vm';
import { startGameServer } from './server.mjs';

async function ready(page) {
  await expect(page.locator('#offline-status')).toHaveText('Готово к игре офлайн · 15 из 15 игр', {
    timeout: 20000,
  });
  await expect(page.locator('#offline-status')).toHaveAttribute('data-ready', 'true');
}

// Fetch through the worker just as a game would. Duplicate sprites can share a
// cache entry, so testing every public URL also checks the worker's alias map.
async function verifyOfflineFiles(page) {
  const manifest = await readFile(new URL('../../offline-files.js', import.meta.url), 'utf8');
  const files = runInNewContext(manifest + '\nOFFLINE_FILES');
  const failures = await page.evaluate(async (files) => {
    const failures = [];
    for (const [path, integrity, bytes] of files) {
      try {
        const response = await fetch(path, { cache: 'no-store' });
        if (!response.ok) throw new Error('HTTP ' + response.status);
        const body = await response.arrayBuffer();
        const hash = new Uint8Array(await crypto.subtle.digest('SHA-256', body));
        if (body.byteLength !== bytes || 'sha256-' + btoa(String.fromCharCode(...hash)) !== integrity)
          throw new Error('Unexpected content');
      } catch (error) {
        failures.push(path + ': ' + error.message);
      }
    }
    return failures;
  }, files);
  expect(failures).toEqual([]);
}

test('весь пакет переживает отключение сервера и полный перезапуск браузера', async ({
  browserName,
  playwright,
  launchOptions,
  channel,
  viewport,
  isMobile,
  hasTouch,
  userAgent,
  deviceScaleFactor,
}) => {
  test.setTimeout(60000);
  const server = await startGameServer();
  const profile = await mkdtemp(join(tmpdir(), 'playroom-offline-'));
  const launch = () =>
    playwright[browserName].launchPersistentContext(profile, {
      ...launchOptions,
      channel,
      viewport,
      isMobile,
      hasTouch,
      userAgent,
      deviceScaleFactor,
      reducedMotion: 'reduce',
    });
  let context;
  let serverClosed = false;
  try {
    context = await launch();
    let page = await context.newPage();
    // This is the only online navigation in the entire browser profile.
    await page.goto(server.url);
    await ready(page);
    await page.locator('#lobby-sound').click();
    await expect(page.locator('#lobby-sound')).toHaveAttribute('aria-pressed', 'true');
    const start = await page.evaluate(async () => {
      const manifestURL = document.querySelector('link[rel="manifest"]').href;
      const manifest = await (await fetch(manifestURL)).json();
      return new URL(manifest.start_url, manifestURL).href;
    });
    expect(start).toBe(String(server.url));
    await context.close();
    context = null;
    await server.close();
    serverClosed = true;

    context = await launch();
    page = await context.newPage();
    await page.goto(start);
    await ready(page);
    await expect(page.locator('.catalog .cover-card')).toHaveCount(15);
    const unlistedRequestFailed = await page.evaluate(async () => {
      try {
        await fetch('./uncached-connectivity-probe', { cache: 'no-store' });
        return false;
      } catch {
        return true;
      }
    });
    expect(unlistedRequestFailed).toBe(true);
    await verifyOfflineFiles(page);
    await expect(page.locator('#lobby-sound')).toHaveAttribute('aria-pressed', 'true');

    await page.locator('[data-game-link="block-maze"]').click();
    // The start button only works once game.js has loaded. Its progress panel
    // fills the history list on load, so wait for that before pressing it.
    await expect(page.locator('#game-history li').first()).toBeAttached();
    await page.locator('#play').click();
    if (hasTouch) await page.locator('[data-dir=right]').tap();
    else await page.keyboard.press('ArrowRight');
    await expect(page.locator('#gems')).toHaveText(/^[1-9]\d*\s*\//);

    await page.goto(start);
    await page.locator('[data-mode="mystery"]').click();
    await page.locator('#start-mode').click();
    await page.locator('[data-room="0"]').click();
    await expect.poll(() => page.evaluate(async () => {
      const { gameAudio } = await import('./game-audio.js');
      return gameAudio.instrument()?.context.state;
    })).toBe('running');
    await page.locator('.case-search').click();
    await expect(page.locator('.case-count')).toHaveText('Улики 1/3');
    await page.locator('#go-lobby').click();
    await page.reload();
    await page.locator('#continue-saved').click();
    await expect(page.locator('#sheet-title')).toHaveText('Пауза');
    await page.locator('#sheet-action').click();
    await expect(page.locator('.case-count')).toHaveText('Улики 1/3');
  } finally {
    await context?.close();
    if (!serverClosed) await server.close();
    await rm(profile, { recursive: true, force: true });
  }
});

test('после обрыва пакета кнопка повтора догружает пропущенный ресурс', async ({ page }) => {
  let interrupt = true;
  let attempts = 0;
  // An embedded game script is fetched only by the offline installer on the home page.
  const server = await startGameServer({
    rejectRequest(path) {
      if (!path.endsWith('/games/block-dash/engine.js')) return false;
      attempts++;
      return interrupt;
    },
  });
  try {
    await page.goto(server.url);
    const status = page.locator('#offline-status');
    await expect(page.locator('#offline-retry')).toBeVisible();
    await expect(status).toContainText('Загрузка не завершена');
    await expect(status).not.toHaveAttribute('data-ready', 'true');
    expect(attempts).toBeGreaterThan(0);
    const failedAttempts = attempts;
    interrupt = false;
    await page.locator('#offline-retry').click();
    await ready(page);
    await expect(page.locator('#offline-retry')).toBeHidden();
    expect(attempts).toBeGreaterThan(failedAttempts);
  } finally {
    await server.close();
  }
});
