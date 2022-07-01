import { Page } from '@playwright/test';

export class FlextabThread {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}
}
