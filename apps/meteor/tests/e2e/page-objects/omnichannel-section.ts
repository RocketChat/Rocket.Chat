import type { Locator, Page } from '@playwright/test';

export class OmnichannelSection {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	get btnContactCenter(): Locator {
		return this.page.locator('role=button[name="Contact Center"]');
	}

	get tabContacts(): Locator {
		return this.page.locator('role=tab[name="Contacts"]');
	}
}
