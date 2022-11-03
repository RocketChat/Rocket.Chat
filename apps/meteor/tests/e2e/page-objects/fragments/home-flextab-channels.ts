import type { Locator, Page } from '@playwright/test';

export class HomeFlextabChannels {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	get btnAddExisting(): Locator {
		return this.page.locator('button >> text="Add Existing"');
	}

	get inputChannels(): Locator {
		return this.page.locator('#modal-root input').first();
	}

	get btnAdd(): Locator {
		return this.page.locator('#modal-root button:has-text("Add")');
	}
}
