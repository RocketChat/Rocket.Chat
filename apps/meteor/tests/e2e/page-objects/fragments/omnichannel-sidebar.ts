import { Page } from '@playwright/test';

export class OmnichannelSidebar {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	async doOpenChat(name: string): Promise<void> {
		await this.page.locator('[data-qa="sidebar-search"]').click();
		await this.page.locator('[data-qa="sidebar-search-input"]').type(name);
		await this.page.locator('[data-qa="sidebar-item-title"]', { hasText: name }).first().click();
	}
}
