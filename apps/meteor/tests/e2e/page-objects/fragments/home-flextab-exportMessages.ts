import type { Page } from '@playwright/test';

export class HomeFlextabExportMessages {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	get sendEmailMethod() {
		return this.page.getByLabel('Send email');
	}

	get downloadFileMethod() {
		return this.page.getByLabel('Download file');
	}

	getMethodByName(name: string) {
		return this.page.getByRole('option', { name });
	}

	get textboxAdditionalEmails() {
		return this.page.getByRole('textbox', { name: 'To additional emails' });
	}

	get btnSend() {
		return this.page.locator('role=button[name="Send"]');
	}

	get btnCancel() {
		return this.page.locator('role=button[name="Cancel"]');
	}
}
