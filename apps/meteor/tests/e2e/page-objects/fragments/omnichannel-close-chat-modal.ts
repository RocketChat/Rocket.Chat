import type { Locator, Page } from '@playwright/test';

export class OmnichannelCloseChatModal {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	get inputComment(): Locator {
		return this.page.locator('input[name="comment"]');
	}

	get btnConfirm(): Locator {
		return this.page.locator('//button[contains(text(), "Confirm")]');
	}
}
