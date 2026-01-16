import type { Locator, Page } from '@playwright/test';

export class FederationAccountProfile {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	get inputName(): Locator {
		return this.page.locator('//label[contains(text(), "Name")]/..//input');
	}

	get btnSubmit(): Locator {
		return this.page.getByRole('button', { name: 'Save changes', exact: true });
	}
}
