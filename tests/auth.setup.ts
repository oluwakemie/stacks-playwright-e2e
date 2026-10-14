import { test as setup, expect } from '@playwright/test';
import { RegisterPage } from '../pages/RegisterPage';

const AUTH_FILE = '.auth/user.json';

// Session and account record both live in localStorage on this app (no
// cookies, no sessionStorage), so one snapshot right after registration
// captures everything an authenticated test needs.
setup('register a shared account and save its authenticated storage state', async ({ page }) => {
  const registerPage = new RegisterPage(page);
  const email = `qa.shared.${Date.now()}.${Math.floor(Math.random() * 1e6)}@example.com`;

  await registerPage.goto();
  await registerPage.register({
    name: 'Shared User',
    email,
    password: 'Password1',
    confirmPassword: 'Password1',
  });

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByTestId('dashboard_page')).toBeVisible();

  await page.context().storageState({ path: AUTH_FILE });
});
