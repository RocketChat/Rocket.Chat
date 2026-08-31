import type { Locator, Page } from '@playwright/test';

import { Modal } from './modal';

export class FileUploadModal extends Modal {
	constructor(page: Page) {
		super(page.getByRole('dialog', { name: 'File Upload' }));
	}

	private get inputFileName() {
		return this.root.getByRole('textbox', { name: 'File name' });
	}

	private get updateButton() {
		return this.root.getByRole('button', { name: 'Update' });
	}

	setName(fileName: string) {
		return this.inputFileName.fill(fileName);
	}

	async update() {
		await this.updateButton.click();
		await this.waitForDismissal();
	}
}

export class FileUploadWarningModal extends Modal {
	constructor(root: Locator) {
		super(root);
	}

	get btnOk() {
		return this.root.getByRole('button', { name: 'Ok' });
	}

	get btnSendAnyway() {
		return this.root.getByRole('button', { name: 'Send anyway' });
	}

	getContent(text: string) {
		return this.root.getByText(text);
	}

	private get btnCancel() {
		return this.root.getByRole('button', { name: 'Cancel' });
	}

	async cancel() {
		await this.btnCancel.click();
		await this.waitForDismissal();
	}

	async confirmSend() {
		await this.btnSendAnyway.click();
		await this.waitForDismissal();
	}
}
