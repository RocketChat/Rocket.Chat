import { Page } from '@playwright/test';

export class HomeTabSearch {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}
}
