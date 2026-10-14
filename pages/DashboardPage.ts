import type { Locator, Page } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;

  readonly greeting: Locator;
  readonly userName: Locator;
  readonly logoutButton: Locator;

  readonly searchInput: Locator;
  readonly searchClearButton: Locator;

  readonly feedTabAll: Locator;
  readonly feedTabBook: Locator;
  readonly feedTabArticle: Locator;

  readonly resultCount: Locator;
  readonly catalogCards: Locator;
  readonly emptyState: Locator;
  readonly resetButton: Locator;

  readonly topicButtons: Locator;

  readonly homeLink: Locator;
  readonly savedLink: Locator;
  readonly profileLink: Locator;

  constructor(page: Page) {
    this.page = page;

    this.greeting = page.getByTestId('dashboard_greeting');
    this.userName = page.getByTestId('side_nav_user_name');
    this.logoutButton = page.getByTestId('side_nav_logout_button');

    this.searchInput = page.getByTestId('catalog_search_input');
    this.searchClearButton = page.getByTestId('catalog_search_clear_button');

    this.feedTabAll = page.getByTestId('feed_tab_all');
    this.feedTabBook = page.getByTestId('feed_tab_book');
    this.feedTabArticle = page.getByTestId('feed_tab_article');

    this.resultCount = page.getByTestId('catalog_result_count');
    this.catalogCards = page.getByTestId('catalog_card');
    this.emptyState = page.getByTestId('catalog_empty_state');
    this.resetButton = page.getByTestId('catalog_reset_button');

    // No dedicated testid per topic label/count; selected via visible text instead.
    this.topicButtons = page.getByTestId('topic_button');

    this.homeLink = page.getByTestId('side_nav_home_link');
    this.savedLink = page.getByTestId('side_nav_saved_link');
    this.profileLink = page.getByTestId('side_nav_profile_link');
  }

  async goto(): Promise<void> {
    await this.page.goto('/dashboard');
  }

  async search(term: string): Promise<void> {
    await this.searchInput.fill(term);
  }

  async selectTopic(label: string): Promise<void> {
    await this.topicButtons.filter({ hasText: label }).first().click();
  }

  async logout(): Promise<void> {
    await this.logoutButton.click();
  }
}
