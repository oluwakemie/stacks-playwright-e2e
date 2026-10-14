import type { Locator, Page } from '@playwright/test';

type LoginFields = {
  email?: string;
  password?: string;
};

export class LoginPage {
  readonly page: Page;

  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly passwordToggle: Locator;
  readonly submitButton: Locator;
  readonly registerLink: Locator;

  readonly emailError: Locator;
  readonly passwordError: Locator;
  readonly formError: Locator;

  constructor(page: Page) {
    this.page = page;

    this.emailInput = page.getByTestId('login_email_input');
    this.passwordInput = page.getByTestId('login_password_input');
    this.passwordToggle = page.getByTestId('login_password_visibility_toggle');
    this.submitButton = page.getByTestId('login_submit_button');
    this.registerLink = page.getByTestId('register_link');

    this.emailError = page.getByTestId('login_email_error');
    this.passwordError = page.getByTestId('login_password_error');
    this.formError = page.getByTestId('login_form_error');
  }

  async goto(): Promise<void> {
    await this.page.goto('/login');
  }

  async fillForm({ email, password }: LoginFields = {}): Promise<void> {
    if (email !== undefined) await this.emailInput.fill(email);
    if (password !== undefined) await this.passwordInput.fill(password);
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  async login(fields: LoginFields): Promise<void> {
    await this.fillForm(fields);
    await this.submit();
  }
}
