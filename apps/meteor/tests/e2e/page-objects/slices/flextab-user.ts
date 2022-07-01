import { Page } from '@playwright/test';

export class FlextabUser {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}
}
