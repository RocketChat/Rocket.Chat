import { Page, Locator } from '@playwright/test';

export class HomeSidenav {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	get btnCreate(): Locator {
		return this.page.locator('[data-qa="sidebar-create"]');
	}

	get checkboxChannelType(): Locator {
		return this.page.locator(
			'//*[@id="modal-root"]//*[contains(@class, "rcx-field") and contains(text(), "Private")]/../following-sibling::label/i',
		);
	}

	get inputChannelName(): Locator {
		return this.page.locator('#modal-root [placeholder="Channel Name"]');
	}

	get btnCreateChannel(): Locator {
		return this.page.locator('//*[@id="modal-root"]//button[contains(text(), "Create")]');
	}

	createOptionByText(text: string) {
		return this.page.locator(`li.rcx-option >> text="${text}"`);
	}

	async doOpenChat(name: string): Promise<void> {
		await this.page.locator('[data-qa="sidebar-search"]').click();
		await this.page.locator('[data-qa="sidebar-search-input"]').type(name);
		await this.page.locator('[data-qa="sidebar-item-title"]', { hasText: name }).first().click();
	}

	async doOpenProfile(): Promise<void> {
		await this.page.locator('[data-qa="sidebar-avatar-button"]').click();
		await this.page.locator('//li[@class="rcx-option"]//div[contains(text(), "My Account")]').click();
	}
}