import { test, expect } from '@playwright/test';
import { RegisterPage } from '../pages/RegisterPage';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';

// Runs in the "chromium-unauthenticated" project: starts with no session and
// manages its own credentials.
test('full journey: register, browse the catalog, log out, then log back in with the same credentials', async ({ page }) => {
  const registerPage = new RegisterPage(page);
  const loginPage = new LoginPage(page);
  const dashboardPage = new DashboardPage(page);

  const email = `qa.journey.${Date.now()}.${Math.floor(Math.random() * 1e6)}@example.com`;
  const password = 'Password1';

  await test.step('1. register a brand new account and land on the dashboard', async () => {
    await registerPage.goto();
    await registerPage.register({ name: 'Journey Tester', email, password, confirmPassword: password });

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(dashboardPage.greeting).toHaveText('Good to see you, Journey.');
    await expect(dashboardPage.userName).toHaveText('Journey Tester');
    await expect(dashboardPage.catalogCards).toHaveCount(16);
  });

  await test.step('2. filter the catalog with the Books tab', async () => {
    await dashboardPage.feedTabBook.click();

    await expect(dashboardPage.resultCount).toHaveText('9 results');
    await expect(dashboardPage.catalogCards).toHaveCount(9);
  });

  await test.step('3. log out and land on the login page', async () => {
    await dashboardPage.logout();

    await expect(page).toHaveURL(/\/login$/);
    await expect(loginPage.submitButton).toBeVisible();
  });

  await test.step('4. log back in with the exact same email and password from step 1', async () => {
    await loginPage.login({ email, password });

    await expect(page).toHaveURL(/\/dashboard$/);
  });

  await test.step('5. the dashboard renders again for the same account', async () => {
    await expect(dashboardPage.greeting).toHaveText('Good to see you, Journey.');
    await expect(dashboardPage.userName).toHaveText('Journey Tester');
    await expect(dashboardPage.resultCount).toHaveText('16 results');
    await expect(dashboardPage.catalogCards).toHaveCount(16);
  });
});
