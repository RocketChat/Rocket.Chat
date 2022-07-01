import { Page } from '@playwright/test';

export class FlextabNotification {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}
}
