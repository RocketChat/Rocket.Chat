import { Locator, Page } from '@playwright/test';

import { AccountSidebar } from './fragments';

export class AccountProfile {
	private readonly page: Page;

	readonly sidebar: AccountSidebar;

	constructor(page: Page) {
		this.page = page;

		this.sidebar = new AccountSidebar(page);
	}

	get inputName(): Locator {
		return this.page.locator('//label[contains(text(), "Name")]/..//input');
	}
	
	get inputUsername(): Locator {
		return this.page.locator('//label[contains(text(), "Username")]/..//input');
	}
	
	get btnSubmit(): Locator {
		return this.page.locator('[data-qa="AccountProfilePageSaveButton"]');
	}
}
