import { Page } from '@playwright/test';

export class HomeTabNotification {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}
}
