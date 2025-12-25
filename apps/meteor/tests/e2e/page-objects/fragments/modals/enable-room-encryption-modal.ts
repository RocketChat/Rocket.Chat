import type { Page } from 'playwright-core';

import { Modal } from './modal';
import { ToastMessages } from '../toast-messages';

export class EnableRoomEncryptionModal extends Modal {
	private readonly toastMessages: ToastMessages;

	constructor(page: Page) {
		super(page.getByRole('dialog', { name: 'Enable encryption' }));
		this.toastMessages = new ToastMessages(page);
	}

	private get enableButton() {
		return this.root.getByRole('button', { name: 'Enable encryption' });
	}

	async enable() {
		await this.enableButton.click();
		await this.waitForDismissal();
		await this.toastMessages.dismissToast('success');
	}
}
