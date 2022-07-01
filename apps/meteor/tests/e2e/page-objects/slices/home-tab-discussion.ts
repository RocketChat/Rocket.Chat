import { Page } from '@playwright/test';

export class HomeTabDiscussion {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}
}
