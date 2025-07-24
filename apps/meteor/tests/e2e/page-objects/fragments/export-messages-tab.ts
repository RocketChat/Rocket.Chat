import type { Locator, Page } from '@playwright/test';

export class ExportMessagesTab {
	private readonly root: Locator;

	constructor(page: Page) {
		this.root = page.getByRole('dialog', { name: 'Export Messages' });
	}

	async exposeMethods() {
		await this.method.click();
	}

	async setMethod(optionName: string) {
		await this.exposeMethods();
		await this.root.page().getByRole('option', { name: optionName }).click();
	}

	async exposeOutputFormats() {
		await this.outputFormat.click();
	}

	async setOutputFormat(optionName: string) {
		await this.exposeOutputFormats();
		await this.root.page().getByRole('option', { name: optionName }).click();
	}

	getMethodOptionByName(name: string) {
		return this.root.page().getByRole('option', { name });
	}

	getOutputFormatOptionByName(name: string) {
		return this.root.page().getByRole('option', { name });
	}

	async selectAllMessages() {
		await this.root
			.page()
			.getByRole('button', { name: /Select \d+ messages/ })
			.click();
	}

	async downloadMessages() {
		const [download] = await Promise.all([this.root.page().waitForEvent('download'), this.downloadButton.click()]);
		return download;
	}

	async send() {
		await this.sendButton.click();
	}

	async setAdditionalEmail(email: string) {
		await this.toAdditionalEmailsInput.fill(email);
	}

	get method() {
		return this.root.getByTestId('export-messages-method');
	}

	get outputFormat() {
		return this.root.page().getByTestId('export-messages-output-format');
	}

	get toAdditionalEmailsInput() {
		return this.root.getByRole('textbox', { name: 'To additional emails' });
	}

	get downloadButton() {
		return this.root.getByRole('button', { name: 'Download', exact: true });
	}

	get sendButton() {
		return this.root.getByRole('button', { name: 'Send', exact: true });
	}
}
