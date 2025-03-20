import type { Locator, Page } from '@playwright/test';

export class OmnichannelRoomInfo {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	getInfo(value: string): Locator {
		return this.page.locator(`span >> text="${value}"`);
	}

	getLabel(label: string): Locator {
		return this.page.locator(`div >> text="${label}"`);
	}
}
