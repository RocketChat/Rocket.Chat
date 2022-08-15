import type { Locator, Page } from '@playwright/test';

export class OmnichannelSection {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	get element(): Locator {
		return this.page.locator('div[data-qa-id="omncSection"]');
	}

	get btnVoipToggle(): Locator {
		return this.page.locator('button[data-qa-id="omncVoipToggleButton"]');
	}

	get btnDialpad(): Locator {
		return this.page.locator('button[data-qa-id="omncDialPadButton"]');
	}
}
