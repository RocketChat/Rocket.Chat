import type { Locator, Page } from '@playwright/test';

export class AdminFlextabEmoji {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	get nameInput(): Locator {
		return this.page.locator('role=textbox[name="Name"]');
	}

	get btnSave(): Locator {
		return this.page.locator('role=button[name="Save"]');
	}

	get btnDelete(): Locator {
		return this.page.locator('role=button[name="Delete"]');
	}
}
