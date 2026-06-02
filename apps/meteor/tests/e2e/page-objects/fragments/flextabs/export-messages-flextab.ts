import type { Locator, Page } from '@playwright/test';

import { FlexTab } from './flextab';

export class ExportMessagesFlexTab extends FlexTab {
	constructor(page: Page) {
		super(page.getByRole('dialog', { name: 'Export Messages' }));
	}

	async exposeMethods() {
		await this.method.click();
	}

	async setMethod(optionName: string) {
		await this.selectOptionWithRetry(this.method, optionName);
	}

	async exposeOutputFormats() {
		await this.outputFormat.click();
	}

	async setOutputFormat(optionName: string) {
		await this.selectOptionWithRetry(this.outputFormat, optionName);
	}

	getMethodOptionByName(name: string) {
		return this.root.page().getByRole('option', { name });
	}

	getOutputFormatOptionByName(name: string) {
		return this.root.page().getByRole('option', { name });
	}

	private async selectOptionWithRetry(trigger: Locator, optionName: string): Promise<void> {
		const option = this.root.page().getByRole('option', { name: optionName });

		for (let attempt = 0; attempt < 2; attempt++) {
			await trigger.click();
			if (await option.isVisible({ timeout: 3_000 }).catch(() => false)) {
				await option.click();
				return;
			}
		}

		await option.click();
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
		await this.inputAdditionalEmails.fill(email);
	}

	getMessageCheckbox(messageText: string): Locator {
		return this.root.page().getByRole('listitem').filter({ hasText: messageText }).getByRole('checkbox');
	}

	get inputUsers() {
		return this.root.getByRole('combobox', { name: 'To users' });
	}

	get inputAdditionalEmails() {
		return this.root.getByRole('textbox', { name: 'To additional emails' });
	}

	get method() {
		return this.root.getByTestId('export-messages-method');
	}

	get outputFormat() {
		return this.root.page().getByTestId('export-messages-output-format');
	}

	get downloadButton() {
		return this.root.getByRole('button', { name: 'Download', exact: true });
	}

	get sendButton() {
		return this.root.getByRole('button', { name: 'Send', exact: true });
	}

	get clearSelectionButton() {
		return this.root.page().getByRole('button', { name: 'Clear selection' });
	}
}
