import type { Locator, Page } from '@playwright/test';

export class AcrossPage {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	get btnVerticalBarClose(): Locator {
		return this.page.locator('[data-qa="VerticalBarActionClose"]');
	}
}
