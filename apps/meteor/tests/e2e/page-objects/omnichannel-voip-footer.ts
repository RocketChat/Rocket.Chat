import type { Locator, Page } from '@playwright/test';

export class OmnichannelVoipFooter {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	get element(): Locator {
		return this.page.locator('[data-qa-id="omncVoipFooter"]');
	}

	get btnReject(): Locator {
		return this.page.locator('[data-qa-id="omncVoipRejectButton"]');
	}

	get textTitle(): Locator {
		return this.page.locator('[data-qa-id="omncVoipTitle"]');
	}
}
