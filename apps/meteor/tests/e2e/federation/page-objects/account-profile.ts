import type { Locator, Page } from '@playwright/test';

import { FederationAccountSidenav } from './fragments/account-sidenav';

export class FederationAccountProfile {
	private readonly page: Page;

	readonly sidenav: FederationAccountSidenav;

	constructor(page: Page) {
		this.page = page;
		this.sidenav = new FederationAccountSidenav(page);
	}

	get inputName(): Locator {
		return this.page.locator('//label[contains(text(), "Name")]/..//input');
	}

	get btnSubmit(): Locator {
		return this.page.locator('[data-qa="AccountProfilePageSaveButton"]');
	}
}
