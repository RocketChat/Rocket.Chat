import type { Page } from '@playwright/test';

export class HomeFlextabExportMessages {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	get downloadFileMethod() {
		return this.page.getByLabel('Download file');
	}

	getMethod(name: string) {
		return this.page.getByRole('button', { name });
	}

	getMethodOptionByName(name: string) {
		return this.page.getByRole('option', { name });
	}

	getOutputFormat(name: string) {
		return this.page.getByRole('button', { name, exact: true });
	}

	getOutputFormatOptionByName(name: string) {
		return this.page.getByRole('option', { name });
	}

	get outputFormat() {
		return this.page.getByRole('button', { name: 'JSON' });
	}

	get btnSelectMessages() {
		return this.page.getByRole('button', { name: 'Select 1 messages' });
	}

	get btnDownloadExportMessages() {
		return this.page.getByRole('button', { name: 'Download', exact: true });
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
