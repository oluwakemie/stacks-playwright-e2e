import { test, expect } from '@playwright/test';
import { RegisterPage } from '../pages/RegisterPage';

function uniqueEmail(tag: string): string {
  return `qa.${tag}.${Date.now()}.${Math.floor(Math.random() * 1e6)}@example.com`;
}

const VALID_PASSWORD = 'Password1';

test.describe('Register', () => {
  test('happy path: valid registration succeeds and lands on dashboard', async ({ page }) => {
    const registerPage = new RegisterPage(page);
    const email = uniqueEmail('happy');
    await registerPage.goto();

    await registerPage.register({
      name: 'Ada Lovelace',
      email,
      password: VALID_PASSWORD,
      confirmPassword: VALID_PASSWORD,
    });

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByTestId('dashboard_greeting')).toHaveText('Good to see you, Ada.');
    await expect(page.getByTestId('side_nav_user_name')).toHaveText('Ada Lovelace');
  });

  test('empty submit shows a required error for every field', async ({ page }) => {
    const registerPage = new RegisterPage(page);
    await registerPage.goto();

    await registerPage.submit();

    await expect(registerPage.nameError).toHaveText('Name is required');
    await expect(registerPage.emailError).toHaveText('Email is required');
    await expect(registerPage.passwordError).toHaveText('Password is required');
    await expect(registerPage.confirmPasswordError).toHaveText('Confirm your password');
    await expect(page).toHaveURL(/\/register$/);
  });

  test('whitespace-only name is treated as empty', async ({ page }) => {
    const registerPage = new RegisterPage(page);
    await registerPage.goto();

    await registerPage.register({
      name: '   ',
      email: uniqueEmail('ws'),
      password: VALID_PASSWORD,
      confirmPassword: VALID_PASSWORD,
    });

    await expect(registerPage.nameError).toHaveText('Name is required');
    await expect(page).toHaveURL(/\/register$/);
  });

  test('invalid email format is rejected', async ({ page }) => {
    const registerPage = new RegisterPage(page);
    await registerPage.goto();

    await registerPage.register({
      name: 'Test User',
      email: 'not-an-email',
      password: VALID_PASSWORD,
      confirmPassword: VALID_PASSWORD,
    });

    await expect(registerPage.emailError).toHaveText('Enter a valid email address');
    await expect(page).toHaveURL(/\/register$/);
  });

  test('password shorter than 8 characters is rejected', async ({ page }) => {
    const registerPage = new RegisterPage(page);
    await registerPage.goto();

    await registerPage.register({
      name: 'Test User',
      email: uniqueEmail('shortpw'),
      password: 'short',
      confirmPassword: 'short',
    });

    await expect(registerPage.passwordError).toHaveText('Password must be at least 8 characters');
    await expect(page).toHaveURL(/\/register$/);
  });

  test('password without both a letter and a number is rejected', async ({ page }) => {
    const registerPage = new RegisterPage(page);
    await registerPage.goto();

    await registerPage.register({
      name: 'Test User',
      email: uniqueEmail('lettersonly'),
      password: 'abcdefgh',
      confirmPassword: 'abcdefgh',
    });

    await expect(registerPage.passwordError).toHaveText('Password must include a letter and a number');
    await expect(page).toHaveURL(/\/register$/);
  });

  test('mismatched password confirmation is rejected', async ({ page }) => {
    const registerPage = new RegisterPage(page);
    await registerPage.goto();

    await registerPage.register({
      name: 'Test User',
      email: uniqueEmail('mismatch'),
      password: VALID_PASSWORD,
      confirmPassword: 'Different1',
    });

    await expect(registerPage.confirmPasswordError).toHaveText('Passwords do not match');
    await expect(page).toHaveURL(/\/register$/);
  });

  test('registering with an email already used in this session is rejected', async ({ page }) => {
    const registerPage = new RegisterPage(page);
    const email = uniqueEmail('dup');

    await registerPage.goto();
    await registerPage.register({
      name: 'First Owner',
      email,
      password: VALID_PASSWORD,
      confirmPassword: VALID_PASSWORD,
    });
    await expect(page).toHaveURL(/\/dashboard$/);

    await page.getByTestId('side_nav_logout_button').click();
    await expect(page).toHaveURL(/\/login$/);

    await registerPage.goto();
    await registerPage.register({
      name: 'Second Owner',
      email,
      password: VALID_PASSWORD,
      confirmPassword: VALID_PASSWORD,
    });

    await expect(registerPage.emailError).toHaveText('An account with this email already exists');
    await expect(page).toHaveURL(/\/register$/);
  });

  test('a script-injection-style name renders as literal text, not executed', async ({ page }) => {
    const registerPage = new RegisterPage(page);
    const payload = '<script>window.__xss = true;</script>';

    let dialogFired = false;
    page.on('dialog', async (dialog) => {
      dialogFired = true;
      await dialog.dismiss();
    });

    await registerPage.goto();
    await registerPage.register({
      name: payload,
      email: uniqueEmail('xss'),
      password: VALID_PASSWORD,
      confirmPassword: VALID_PASSWORD,
    });

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByTestId('side_nav_user_name')).toHaveText(payload);
    const executedFlag = await page.evaluate(() => (window as Window & { __xss?: boolean }).__xss);
    expect(executedFlag).toBeUndefined();
    expect(dialogFired).toBe(false);
  });

  test('a very long name is accepted without truncation (no max length enforced)', async ({ page }) => {
    const registerPage = new RegisterPage(page);
    const longName = 'A'.repeat(300);

    await registerPage.goto();
    await registerPage.register({
      name: longName,
      email: uniqueEmail('longname'),
      password: VALID_PASSWORD,
      confirmPassword: VALID_PASSWORD,
    });

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByTestId('side_nav_user_name')).toHaveText(longName);
  });

  test('rapid double-click on submit results in exactly one successful registration', async ({ page }) => {
    const registerPage = new RegisterPage(page);
    await registerPage.goto();
    await registerPage.fillForm({
      name: 'Double Click',
      email: uniqueEmail('dblclick'),
      password: VALID_PASSWORD,
      confirmPassword: VALID_PASSWORD,
    });

    await registerPage.submitButton.click();
    await registerPage.submitButton.click({ timeout: 2000 }).catch(() => {});

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(registerPage.emailError).toHaveCount(0);
  });

  test('refreshing the page mid-input clears entered data', async ({ page }) => {
    const registerPage = new RegisterPage(page);
    await registerPage.goto();
    await registerPage.nameInput.fill('Not Yet Submitted');

    await page.reload();

    await expect(registerPage.nameInput).toHaveValue('');
  });

  test('password visibility toggle switches the password field between masked and visible', async ({ page }) => {
    const registerPage = new RegisterPage(page);
    await registerPage.goto();
    await registerPage.passwordInput.fill('Secret123');

    await expect(registerPage.passwordInput).toHaveAttribute('type', 'password');
    await expect(registerPage.passwordToggle).toHaveAttribute('aria-label', 'Show password');

    await registerPage.passwordToggle.click();

    await expect(registerPage.passwordInput).toHaveAttribute('type', 'text');
    await expect(registerPage.passwordToggle).toHaveAttribute('aria-label', 'Hide password');
  });

  test('confirm-password visibility toggle switches the confirm field between masked and visible', async ({ page }) => {
    const registerPage = new RegisterPage(page);
    await registerPage.goto();
    await registerPage.confirmPasswordInput.fill('Secret123');

    await expect(registerPage.confirmPasswordInput).toHaveAttribute('type', 'password');

    await registerPage.confirmPasswordToggle.click();

    await expect(registerPage.confirmPasswordInput).toHaveAttribute('type', 'text');
    await expect(registerPage.confirmPasswordToggle).toHaveAttribute('aria-label', 'Hide password');
  });
});
