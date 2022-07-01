import { Page } from '@playwright/test';

export class HomeTabStared {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}
}
