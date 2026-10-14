import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  // workers=1 passed 2/2 runs (~56-60s each); workers=2 passed 2/2 runs
  // (~28-32s each, roughly twice as fast) - equally reliable in what's
  // been tested, so workers=2 is the default. workers=4 failed once with
  // ERR_INTERNET_DISCONNECTED but was never re-tested, so that's not
  // confirmed as a consistent problem, just not re-validated.
  workers: 2,
  // CI: one retry so a one-off network blip doesn't block a PR; anything that
  // only passes on retry is marked "flaky" in the report, so it stays visible.
  retries: process.env.CI ? 1 : 0,
  // CI also writes the HTML report that the workflow uploads as an artifact.
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    // The CI workflow sets BASE_URL per environment (see environments.json at
    // the repo root). Locally it defaults to the main deployment.
    baseURL: process.env.BASE_URL || 'https://sng-demo-ci.netlify.app',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], storageState: '.auth/user.json' },
      dependencies: ['setup'],
      testIgnore: [/auth\.setup\.ts/, /register\.spec\.ts/, /login\.spec\.ts/, /full-journey\.spec\.ts/],
    },
    {
      name: 'chromium-unauthenticated',
      use: { ...devices['Desktop Chrome'] },
      testMatch: [/register\.spec\.ts/, /login\.spec\.ts/, /full-journey\.spec\.ts/],
    },
  ],
});
