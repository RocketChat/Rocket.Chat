import type { Locator, Page } from '@playwright/test';

export class OmnichannelDialpadModal {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	get element(): Locator {
		return this.page.locator('dialog[data-qa-id="omncDialpadModal"]');
	}

	get inputPhoneNumber(): Locator {
		return this.page.locator('input[type="text"]');
	}

	get btnCall(): Locator {
		return this.page.locator('button[data-qa-id="omncDialpadCallButton"]');
	}
}
