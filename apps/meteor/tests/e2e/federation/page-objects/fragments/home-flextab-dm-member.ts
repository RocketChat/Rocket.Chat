import type { Locator, Page } from '@playwright/test';

export class FederationHomeFlextabDirectMessageMember {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	getUserInfoUsername(username: string): Locator {
		return this.page.locator(`//div[contains(@class, "rcx-box--full") and contains(@title, "${username}")]`);
	}
}
