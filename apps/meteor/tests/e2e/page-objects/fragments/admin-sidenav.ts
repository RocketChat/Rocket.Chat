import { Locator, Page } from '@playwright/test';

export class AdminSidenav {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	get linkUsers(): Locator {
		return this.page.locator('.flex-nav [href="/admin/users"]');
	}
}
