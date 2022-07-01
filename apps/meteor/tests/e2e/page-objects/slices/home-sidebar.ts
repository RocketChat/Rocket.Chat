import { Page } from '@playwright/test';

export class HomeSidebar {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}
}
