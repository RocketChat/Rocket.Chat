import type { Locator, Page } from '@playwright/test';

export class Marketplace {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	get marketplaceFilter(): Locator {
		return this.page.locator('input[name="marketplaceFilter"]');
	}

	get NoAppMatches(): Locator {
		return this.page.locator('text=No app matches');
	}
}
