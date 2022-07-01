import { Page } from '@playwright/test';

export class FlextabSearch {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}
}
