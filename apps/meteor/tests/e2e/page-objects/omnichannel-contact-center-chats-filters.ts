import type { Locator, Page } from '@playwright/test';

export class OmnichannelChatsFilters {
	protected readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	get inputFrom(): Locator {
		return this.page.locator('input[name="from"]');
	}

	get inputTo(): Locator {
		return this.page.locator('input[name="to"]');
	}

	get btnApply(): Locator {
		return this.page.locator('role=button[name="Apply"]');
	}
}
