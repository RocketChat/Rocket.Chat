import type { Page } from 'playwright-core';

import { Modal } from './modal';
import { ToastMessages } from '../toast-messages';

export class DisableRoomEncryptionModal extends Modal {
	private readonly toastMessages: ToastMessages;

	constructor(page: Page) {
		super(page.getByRole('dialog', { name: 'Disable encryption' }));
		this.toastMessages = new ToastMessages(page);
	}

	private get disableButton() {
		return this.root.getByRole('button', { name: 'Disable encryption' });
	}

	async disable() {
		await this.disableButton.click();
		await this.waitForDismissal();
		await this.toastMessages.dismissToast('success');
	}
}
