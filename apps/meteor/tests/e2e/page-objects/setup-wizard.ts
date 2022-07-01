import { Page } from '@playwright/test';

export class SetupWizard {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}
}
