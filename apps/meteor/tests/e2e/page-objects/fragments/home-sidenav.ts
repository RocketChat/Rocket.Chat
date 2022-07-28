import { Page } from '@playwright/test';

export class HomeSidenav {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	async logout(): Promise<void> {
		await this.page.locator('[data-qa="sidebar-avatar-button"]').click();
		await this.page.locator('//*[contains(@class, "rcx-option__content") and contains(text(), "Logout")]').click();
	}

	async goToMyAccount(): Promise<void> {
		await this.page.locator('[data-qa="sidebar-avatar-button"]').click();
		await this.page.locator('//li[@class="rcx-option"]//div[contains(text(), "My Account")]').click();
	}

	async openChat(name: string): Promise<void> {
		await this.page.locator('[data-qa="sidebar-search"]').click();
		await this.page.locator('[data-qa="sidebar-search-input"]').type(name);
		await this.page.locator('[data-qa="sidebar-item-title"]', { hasText: name }).first().click();
	}
}
