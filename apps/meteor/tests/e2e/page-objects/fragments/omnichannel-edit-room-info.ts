import type { Locator, Page } from '@playwright/test';

export class OmnichannelEditRoomInfo {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	get topic(): Locator {
		return this.page.locator('input[name="topic"]');
	}

	get saveButton(): Locator {
		return this.page.locator('button[data-qa="saveRoomEditInfo"]');
	}
}
