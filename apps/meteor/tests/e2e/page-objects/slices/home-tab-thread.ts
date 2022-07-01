import { Page } from '@playwright/test';

export class HomeTabThread {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}
}
