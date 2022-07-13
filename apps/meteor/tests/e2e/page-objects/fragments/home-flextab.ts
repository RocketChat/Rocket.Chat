import { Locator, Page } from '@playwright/test';

export class HomeFlextab {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	get userInfoUsername(): Locator {
		return this.page.locator('[data-qa="UserInfoUserName"]');
	}
}
