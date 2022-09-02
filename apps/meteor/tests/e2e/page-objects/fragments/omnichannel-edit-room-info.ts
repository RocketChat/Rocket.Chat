import type { Locator, Page } from '@playwright/test';

export class OmnichannelEditRoomInfo {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	get title(): Locator {
		return this.page.locator('text="Edit Room"');
	}

	get inputTopic(): Locator {
		return this.page.locator('input[name="topic"]');
	}

	get btnSave(): Locator {
		return this.page.locator('button[data-qa="saveRoomEditInfo"]');
	}
}
