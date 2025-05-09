import type { Locator, Page } from '@playwright/test';

export class HomeFlextabOtr {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	get otrDialog(): Locator {
		return this.page.getByRole('dialog', { name: 'OTR' });
	}

	get btnStartOTR(): Locator {
		return this.otrDialog.getByRole('button', { name: 'Start OTR' });
	}

	get btnAcceptOTR(): Locator {
		return this.page.getByRole('dialog').getByRole('button', { name: 'Yes' });
	}
}
