import type { Locator, Page } from '@playwright/test';

export class OmnichannelRoomInfo {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	get labelTopic(): Locator {
		return this.page.locator('label[text()="Topic"]');
	}

	get editButton(): Locator {
		return this.page.locator('button[data-qa="editRoomInfo"]');
	}
}
