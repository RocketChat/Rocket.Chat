import type { Page } from 'playwright-core';

import { Modal } from './modal';
import { ToastMessages } from '../toast-messages';

export class SaveE2EEPasswordModal extends Modal {
	private readonly toastMessages: ToastMessages;

	constructor(page: Page) {
		super(page.getByRole('dialog', { name: 'Save your new E2EE password' }));
		this.toastMessages = new ToastMessages(page);
	}

	private get password() {
		return this.root.getByLabel('Your E2EE password is:').getByRole('code');
	}

	private get savedPasswordButton() {
		return this.root.getByRole('button', { name: 'I saved my password' });
	}

	async getPassword() {
		return (await this.password.textContent()) ?? '';
	}

	async confirm() {
		await this.savedPasswordButton.click();
		await this.waitForDismissal();
		await this.toastMessages.dismissToast('success');
	}
}
