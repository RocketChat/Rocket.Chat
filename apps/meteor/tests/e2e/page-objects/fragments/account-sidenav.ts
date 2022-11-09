import type { Locator, Page } from '@playwright/test';

export class AccountSidenav {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	get linkTokens(): Locator {
		return this.page.locator('.flex-nav [href="/account/tokens"]');
	}
}
