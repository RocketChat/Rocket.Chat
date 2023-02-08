import type { Locator, Page } from '@playwright/test';

export class Marketplace {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	get marketplaceFilter(): Locator {
		return this.page.locator('input[name="marketplaceFilter"]');
	}

	get noAppMatches(): Locator {
		return this.page.locator('text=No app matches');
	}

	get appRow(): Locator {
		return this.page.locator('div[data-qa=appRow]');
	}
}
