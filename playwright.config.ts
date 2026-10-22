import process from 'node:process';
import { defineConfig, devices } from '@playwright/test';

const port = process.env.CI ? 4173 : 5173;

export default defineConfig({
  testDir: './e2e',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',
  use: {
    baseURL: `http://localhost:${port}`,
    locale: 'en-US',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: process.env.CI ? 'pnpm preview' : 'pnpm dev',
    port,
    reuseExistingServer: !process.env.CI,
  },
});
