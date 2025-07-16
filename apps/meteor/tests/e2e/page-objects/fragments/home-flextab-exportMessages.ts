import type { Page } from '@playwright/test';

export class HomeFlextabExportMessages {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	get downloadFileMethod() {
		return this.page.getByLabel('Download file');
	}

	async setMethod(optionName: string) {
		await this.method.click();
		await this.page.getByRole('option', { name: optionName }).click();
	}

	async setOutputFormat(optionName: string) {
		await this.outputFormat.click();
		await this.page.getByRole('option', { name: optionName }).click();
	}

	get method() {
		return this.page.getByTestId('export-messages-method');
	}

	getMethodOptionByName(name: string) {
		return this.page.getByRole('option', { name });
	}

	get outputFormat() {
		return this.page.getByTestId('export-messages-output-format');
	}

	getOutputFormatOptionByName(name: string) {
		return this.page.getByRole('option', { name });
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
