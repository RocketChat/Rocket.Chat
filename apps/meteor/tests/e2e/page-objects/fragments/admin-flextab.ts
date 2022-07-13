import { Page } from '@playwright/test';

export class AdminFlextab {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}
}
