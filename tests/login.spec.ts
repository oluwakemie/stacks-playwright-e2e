import { test, expect, type Page } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';

function uniqueEmail(tag: string): string {
  return `qa.${tag}.${Date.now()}.${Math.floor(Math.random() * 1e6)}@example.com`;
}

const VALID_PASSWORD = 'Password1';

// Accounts live in the browser's own storage on this app (no shared backend),
// so a login test must register its own account in the same page/context
// and log out before it can log back in.
async function registerAndLogOut(
  page: Page,
  { name, email, password }: { name: string; email: string; password: string },
): Promise<void> {
  const registerPage = new RegisterPage(page);
  await registerPage.goto();
  await registerPage.register({ name, email, password, confirmPassword: password });
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.getByTestId('side_nav_logout_button').click();
  await expect(page).toHaveURL(/\/login$/);
}

test.describe('Login', () => {
  test('happy path: valid credentials for an existing account log the user in', async ({ page }) => {
    const email = uniqueEmail('happy');
    await registerAndLogOut(page, { name: 'Grace Hopper', email, password: VALID_PASSWORD });

    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login({ email, password: VALID_PASSWORD });

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByTestId('dashboard_greeting')).toHaveText('Good to see you, Grace.');
  });

  test('empty submit shows a required error for both fields', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await loginPage.submit();

    await expect(loginPage.emailError).toHaveText('Email is required');
    await expect(loginPage.passwordError).toHaveText('Password is required');
    await expect(page).toHaveURL(/\/login$/);
  });

  test('whitespace-only email is treated as empty', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await loginPage.login({ email: '   ', password: '   ' });

    await expect(loginPage.emailError).toHaveText('Email is required');
    await expect(page).toHaveURL(/\/login$/);
  });

  test('invalid email format is rejected', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await loginPage.login({ email: 'not-an-email', password: 'whatever1' });

    await expect(loginPage.emailError).toHaveText('Enter a valid email address');
    await expect(page).toHaveURL(/\/login$/);
  });

  test('wrong password for an existing account shows a generic error', async ({ page }) => {
    const email = uniqueEmail('wrongpw');
    await registerAndLogOut(page, { name: 'Wrong Pw', email, password: VALID_PASSWORD });

    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login({ email, password: 'IncorrectPass1' });

    await expect(loginPage.formError).toHaveText('Invalid email or password');
    await expect(page).toHaveURL(/\/login$/);
  });

  test('a non-existent account shows the same generic error', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await loginPage.login({ email: uniqueEmail('nouser'), password: VALID_PASSWORD });

    await expect(loginPage.formError).toHaveText('Invalid email or password');
    await expect(page).toHaveURL(/\/login$/);
  });

  test('a whitespace-only password is submitted as-is (not trimmed) and rejected as invalid', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await loginPage.login({ email: uniqueEmail('wspw'), password: '   ' });

    await expect(loginPage.formError).toHaveText('Invalid email or password');
    await expect(page).toHaveURL(/\/login$/);
  });

  test('rapid double-click on submit results in exactly one successful login', async ({ page }) => {
    const email = uniqueEmail('dblclick');
    await registerAndLogOut(page, { name: 'Double Click', email, password: VALID_PASSWORD });

    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.fillForm({ email, password: VALID_PASSWORD });

    await loginPage.submitButton.click();
    await loginPage.submitButton.click({ timeout: 2000 }).catch(() => {});

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(loginPage.formError).toHaveCount(0);
  });

  test('refreshing the page mid-input clears entered data', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.emailInput.fill('not-yet-submitted@example.com');

    await page.reload();

    await expect(loginPage.emailInput).toHaveValue('');
  });

  test('password visibility toggle switches the password field between masked and visible', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.passwordInput.fill('Secret123');

    await expect(loginPage.passwordInput).toHaveAttribute('type', 'password');
    await expect(loginPage.passwordToggle).toHaveAttribute('aria-label', 'Show password');

    await loginPage.passwordToggle.click();

    await expect(loginPage.passwordInput).toHaveAttribute('type', 'text');
    await expect(loginPage.passwordToggle).toHaveAttribute('aria-label', 'Hide password');
  });
});
