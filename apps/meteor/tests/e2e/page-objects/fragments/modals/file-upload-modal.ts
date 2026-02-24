import type { Page } from '@playwright/test';

import { Modal } from './modal';

export class FileUploadModal extends Modal {
	constructor(page: Page) {
		super(page.getByRole('dialog', { name: 'File Upload' }));
	}

	private get fileNameInput() {
		return this.root.getByRole('textbox', { name: 'File name' });
	}

	private get fileDescriptionInput() {
		return this.root.getByRole('textbox', { name: 'File description' });
	}

	private get sendButton() {
		return this.root.getByRole('button', { name: 'Send' });
	}

	setName(fileName: string) {
		return this.fileNameInput.fill(fileName);
	}

	setDescription(description: string) {
		return this.fileDescriptionInput.fill(description);
	}

	async send() {
		await this.sendButton.click();
		await this.waitForDismissal();
	}
}
