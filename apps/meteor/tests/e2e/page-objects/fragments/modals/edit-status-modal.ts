import type { Page } from 'playwright-core';

import { Modal } from './modal';
import { ToastMessages } from '../toast-messages';

export class EditStatusModal extends Modal {
	readonly toastMessages: ToastMessages;

	constructor(page: Page) {
		super(page.getByRole('dialog', { name: 'Edit Status' }));
		this.toastMessages = new ToastMessages(page);
	}

	private get statusMessageInput() {
		return this.root.getByRole('textbox', { name: 'Status message' });
	}

	async changeStatusMessage(statusMessage: string): Promise<void> {
		await this.statusMessageInput.fill(statusMessage);
		await this.save();
		await this.toastMessages.dismissToast();
	}
}
