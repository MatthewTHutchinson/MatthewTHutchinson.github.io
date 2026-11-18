import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: 'tripteron-simulation.spec.ts',
  timeout: 60000,
  workers: 1,
  outputDir: '/tmp/tripteron-simulation-tests',
  use: {
    baseURL: process.env.PORTFOLIO_URL || 'http://127.0.0.1:4322',
    channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome',
    viewport: { width: 1440, height: 900 },
    screenshot: 'only-on-failure',
  },
});
