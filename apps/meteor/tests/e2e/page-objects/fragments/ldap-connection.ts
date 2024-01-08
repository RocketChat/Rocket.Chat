import type { Locator, Page } from '@playwright/test';

export class LdapConnection {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	get btnTestConnection(): Locator {
		return this.page.locator('role=button[name="Test Connection"]');
	}
}
