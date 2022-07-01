import { Page } from '@playwright/test';

export class OmnichannelSidebar {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}
}
