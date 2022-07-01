import { Page } from '@playwright/test';

export class HomeTabPinned {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}
}
