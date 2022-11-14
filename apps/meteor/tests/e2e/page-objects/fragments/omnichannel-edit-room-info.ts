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

	get inputPriorities(): Locator {
		return this.page.locator('div:has-text("Priority")~span');
	}

	get inputCustomFields(): Locator {
		return this.page.locator('[data-qa="custom-field-form"]');
	}

	get btnSave(): Locator {
		return this.page.locator('role=button[name=Save]');
	}
}
