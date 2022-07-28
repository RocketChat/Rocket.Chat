import { Locator, Page } from '@playwright/test';

export class OmnichannelSidenav {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	get linkDepartments() {
		return this.page.locator('a[href="omnichannel/departments"]');
	}
}
