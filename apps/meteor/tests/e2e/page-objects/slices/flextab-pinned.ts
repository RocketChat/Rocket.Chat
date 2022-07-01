import { Page } from '@playwright/test';

export class FlextabPinned {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}
}
