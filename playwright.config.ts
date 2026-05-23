import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.BASE_URL || 'https://swiftcart-sanaev-dev.lovable.app';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  timeout: 30_000,
  expect: {
    timeout: 10_000
  },
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  outputDir: process.env.TEST_RESULTS_DIR || 'test-results',
  reporter: [
    ['list'],
    ['html', {
      outputFolder: process.env.PLAYWRIGHT_HTML_REPORT || 'playwright-report',
      open: 'never'
    }],
    ['junit', {
      outputFile: process.env.JUNIT_OUTPUT || 'test-results/junit.xml'
    }]
  ],
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 30_000
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] }
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] }
    }
  ]
});
