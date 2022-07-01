import { Page } from '@playwright/test';

export class Auth {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}
}
