import { defineConfig, devices } from '@playwright/test';

const port = Number(process.env.PLAYROOM_TEST_PORT || 42683);
const baseURL = 'http://127.0.0.1:' + port + '/block-playroom/';

export default defineConfig({
  testDir: '.',
  testMatch: '**/*.spec.mjs',
  forbidOnly: !!process.env.CI,
  workers: 2,
  use: { baseURL, trace: 'retain-on-failure', reducedMotion: 'reduce' },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'webkit', use: { ...devices['iPhone 13'] } },
  ],
  webServer: { command: 'node server.mjs ' + port, url: baseURL },
});
