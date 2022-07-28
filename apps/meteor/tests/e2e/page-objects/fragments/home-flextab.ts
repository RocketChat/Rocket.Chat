import { Page } from '@playwright/test';

export class HomeFlextab {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}
}
