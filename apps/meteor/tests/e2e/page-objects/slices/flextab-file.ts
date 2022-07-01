import { Page } from '@playwright/test';

export class FlextabFile {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}
}
