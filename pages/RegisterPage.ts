import type { Locator, Page } from '@playwright/test';

type RegisterFields = {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
};

export class RegisterPage {
  readonly page: Page;

  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly passwordToggle: Locator;
  readonly confirmPasswordToggle: Locator;
  readonly submitButton: Locator;
  readonly loginLink: Locator;
  readonly passwordHint: Locator;

  readonly nameError: Locator;
  readonly emailError: Locator;
  readonly passwordError: Locator;
  readonly confirmPasswordError: Locator;

  constructor(page: Page) {
    this.page = page;

    this.nameInput = page.getByTestId('register_name_input');
    this.emailInput = page.getByTestId('register_email_input');
    this.passwordInput = page.getByTestId('register_password_input');
    this.confirmPasswordInput = page.getByTestId('register_confirm_password_input');
    this.passwordToggle = page.getByTestId('register_password_visibility_toggle');
    this.confirmPasswordToggle = page.getByTestId('register_confirm_password_visibility_toggle');
    this.submitButton = page.getByTestId('register_submit_button');
    this.loginLink = page.getByTestId('login_link');
    this.passwordHint = page.getByTestId('register_password_hint');

    this.nameError = page.getByTestId('register_name_error');
    this.emailError = page.getByTestId('register_email_error');
    this.passwordError = page.getByTestId('register_password_error');
    this.confirmPasswordError = page.getByTestId('register_confirm_password_error');
  }

  async goto(): Promise<void> {
    await this.page.goto('/register');
  }

  async fillForm({ name, email, password, confirmPassword }: RegisterFields = {}): Promise<void> {
    if (name !== undefined) await this.nameInput.fill(name);
    if (email !== undefined) await this.emailInput.fill(email);
    if (password !== undefined) await this.passwordInput.fill(password);
    if (confirmPassword !== undefined) await this.confirmPasswordInput.fill(confirmPassword);
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  async register(fields: RegisterFields): Promise<void> {
    await this.fillForm(fields);
    await this.submit();
  }
}
