import type { Page } from 'playwright-core';

import { Modal } from './modal';

export class EditStatusModal extends Modal {
	constructor(page: Page) {
		super(page.getByRole('dialog', { name: 'Edit Status' }));
	}

	private get statusMessageInput() {
		return this.root.getByRole('textbox', { name: 'Status message' });
	}

	async changeStatusMessage(statusMessage: string): Promise<void> {
		await this.statusMessageInput.fill(statusMessage);
		await this.save();
	}
}
