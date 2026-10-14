import { test, expect, type Page } from '@playwright/test';
import { DashboardPage } from '../pages/DashboardPage';

// The 404 page is the framework default and has no data-testid, so it is
// targeted by heading role instead.
async function expectNotFoundPage(page: Page): Promise<void> {
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('404');
  await expect(page.getByRole('heading', { level: 2 })).toHaveText('This page could not be found.');
}

test.describe('Navigation guards (authenticated)', () => {
  for (const path of ['/register', '/login']) {
    test(`an authenticated visit to ${path} is redirected to the dashboard with real content`, async ({ page }) => {
      const dashboardPage = new DashboardPage(page);

      await page.goto(path);

      await expect(page).toHaveURL(/\/dashboard$/, { timeout: 10000 });
      await expect(page.getByTestId('dashboard_page')).toBeVisible();
      await expect(dashboardPage.greeting).toHaveText('Good to see you, Shared.');
      await expect(dashboardPage.catalogCards).toHaveCount(16);
    });
  }

  test('an unknown URL shows a real 404 page and does not redirect', async ({ page }) => {
    const response = await page.goto('/this-page-does-not-exist');

    expect(response?.status()).toBe(404);
    await expect(page).toHaveURL(/\/this-page-does-not-exist$/);
    await expectNotFoundPage(page);
  });
});

test.describe('Navigation guards (logged out)', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('an unknown URL shows the same real 404 page and does not redirect to login', async ({ page }) => {
    const response = await page.goto('/this-page-does-not-exist');

    expect(response?.status()).toBe(404);
    await expect(page).toHaveURL(/\/this-page-does-not-exist$/);
    await expectNotFoundPage(page);
  });
});
