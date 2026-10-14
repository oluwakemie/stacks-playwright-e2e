import { test, expect } from '@playwright/test';
import { DashboardPage } from '../pages/DashboardPage';

// The default "chromium" project injects the shared account's storageState
// (see auth.setup.ts), so every test here starts already logged in as
// "Shared User" and just navigates to /dashboard.
test.describe('Dashboard (authenticated)', () => {
  test.beforeEach(async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.goto();
    await expect(page.getByTestId('dashboard_page')).toBeVisible();
  });

  test('authenticated user lands on the dashboard and sees the real catalog content', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);

    await expect(dashboardPage.greeting).toHaveText('Good to see you, Shared.');
    await expect(dashboardPage.userName).toHaveText('Shared User');
    await expect(dashboardPage.resultCount).toHaveText('16 results');
    await expect(dashboardPage.catalogCards).toHaveCount(16);
    await expect(dashboardPage.feedTabAll).toContainText('16');
    await expect(dashboardPage.feedTabBook).toContainText('9');
    await expect(dashboardPage.feedTabArticle).toContainText('7');
  });

  test('Books and Articles tabs filter the feed to only that item type', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);

    await dashboardPage.feedTabBook.click();
    await expect(dashboardPage.resultCount).toHaveText('9 results');
    await expect(dashboardPage.catalogCards).toHaveCount(9);
    const bookTypes = await dashboardPage.catalogCards.evaluateAll((cards) => cards.map((c) => c.getAttribute('data-item-type')));
    expect(bookTypes.every((t) => t === 'book')).toBe(true);

    await dashboardPage.feedTabArticle.click();
    await expect(dashboardPage.resultCount).toHaveText('7 results');
    await expect(dashboardPage.catalogCards).toHaveCount(7);
    const articleTypes = await dashboardPage.catalogCards.evaluateAll((cards) => cards.map((c) => c.getAttribute('data-item-type')));
    expect(articleTypes.every((t) => t === 'article')).toBe(true);
  });

  test('search live-filters the catalog without needing a submit action', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);

    await dashboardPage.search('Pride');

    await expect(dashboardPage.resultCount).toHaveText('1 result');
    await expect(dashboardPage.catalogCards).toHaveCount(1);
    await expect(dashboardPage.catalogCards.first().getByTestId('catalog_card_title')).toHaveText('Pride and Prejudice');
  });

  test('the search clear button empties the search and restores the full catalog', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);

    await dashboardPage.search('Pride');
    await expect(dashboardPage.catalogCards).toHaveCount(1);

    await dashboardPage.searchClearButton.click();

    await expect(dashboardPage.searchInput).toHaveValue('');
    await expect(dashboardPage.resultCount).toHaveText('16 results');
  });

  test('a search with no matches shows the real empty state, and "Show everything" resets it', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);

    await dashboardPage.search('zzzznomatch12345');

    await expect(dashboardPage.catalogCards).toHaveCount(0);
    await expect(dashboardPage.emptyState).toContainText('Nothing matches “zzzznomatch12345”');
    await expect(dashboardPage.emptyState).toContainText('Try a different word or switch tabs.');

    await dashboardPage.resetButton.click();

    await expect(dashboardPage.searchInput).toHaveValue('');
    await expect(dashboardPage.resultCount).toHaveText('16 results');
    await expect(dashboardPage.feedTabAll).toHaveAttribute('aria-selected', 'true');
  });

  test('a script-injection-style search string renders as literal text, not executed', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);

    let dialogFired = false;
    page.on('dialog', async (dialog) => {
      dialogFired = true;
      await dialog.dismiss();
    });

    await dashboardPage.search('<script>window.__xss = true;</script>');

    await expect(dashboardPage.emptyState).toBeVisible();
    const executedFlag = await page.evaluate(() => (window as Window & { __xss?: boolean }).__xss);
    expect(executedFlag).toBeUndefined();
    expect(dialogFired).toBe(false);
    const rawScriptTagPresent = await page.evaluate(() => document.body.innerHTML.includes('<script>window.__xss'));
    expect(rawScriptTagPresent).toBe(false);
  });

  test('selecting a topic filters the feed, and combining it with an unrelated tab shows the empty state', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);

    await dashboardPage.selectTopic('Classics');
    await expect(dashboardPage.resultCount).toHaveText('4 results');

    await dashboardPage.feedTabArticle.click();

    await expect(dashboardPage.catalogCards).toHaveCount(0);
    await expect(dashboardPage.emptyState).toContainText('Nothing matches “Classics”');

    await dashboardPage.resetButton.click();
    await expect(dashboardPage.resultCount).toHaveText('16 results');
  });

  test('rapid repeated clicks on feed tabs settle to a single consistent state', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);

    for (let i = 0; i < 5; i += 1) {
      await dashboardPage.feedTabBook.click();
      await dashboardPage.feedTabAll.click();
    }

    await expect(dashboardPage.feedTabAll).toHaveAttribute('aria-selected', 'true');
    await expect(dashboardPage.resultCount).toHaveText('16 results');
    await expect(dashboardPage.catalogCards).toHaveCount(16);
  });

  test('a catalog card is not clickable - there is no detail view for it to open', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);

    await dashboardPage.catalogCards.first().click();

    await expect(page).toHaveURL(/\/dashboard$/);
    const dialogCount = await page.evaluate(() => document.querySelectorAll('[role="dialog"]').length);
    expect(dialogCount).toBe(0);
  });

  test('the Saved and Profile nav links are disabled "coming soon" placeholders', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);

    await expect(dashboardPage.savedLink).toHaveAttribute('aria-disabled', 'true');
    await expect(dashboardPage.profileLink).toHaveAttribute('aria-disabled', 'true');

    await dashboardPage.savedLink.click();

    await expect(page).toHaveURL(/\/dashboard$/);
  });

  // Starts authenticated (shared state); becomes unauthenticated via its own logout action.
  test('logout returns to the login page, and a direct dashboard visit afterward is redirected away', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);

    await dashboardPage.logout();

    await expect(page).toHaveURL(/\/login$/, { timeout: 15000 });

    await dashboardPage.goto();

    await expect(page).toHaveURL(/\/login$/, { timeout: 10000 });
  });

  // Starts authenticated (shared state); becomes unauthenticated via its own logout action.
  test('the browser back button after logout does not reveal cached dashboard content', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);

    await dashboardPage.logout();
    await expect(page).toHaveURL(/\/login$/, { timeout: 15000 });

    await page.goBack();

    await expect(page).toHaveURL('about:blank');
    await expect(page.getByTestId('dashboard_page')).toHaveCount(0);
  });
});

// Needs the override BEFORE the test starts: it must begin with no session at all.
test.describe('Dashboard (no session)', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('a direct dashboard visit with no session at all is redirected to login', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);

    await dashboardPage.goto();

    await expect(page).toHaveURL(/\/login$/, { timeout: 10000 });
  });
});
