import type { Locator, Page } from '@playwright/test';

export class AccountSidenav {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	get tokensLink(): Locator {
		return this.page.locator('.flex-nav [href="/account/tokens"]');
	}

	get securityLink(): Locator {
		return this.page.locator('.flex-nav [href="/account/security"]');
	}

	get closeButton(): Locator {
		return this.page.locator('role=navigation >> role=button[name=Close]');
	}
}
