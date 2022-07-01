import { Page } from '@playwright/test';

export class HomeTabShortcut {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}
}
