import type { Page } from 'playwright-core';

import { Modal } from './modal';
import { ToastMessages } from '../toast-messages';

export class EnterPasswordModal extends Modal {
	readonly toastMessages: ToastMessages;

	constructor(page: Page) {
		super(page.getByRole('dialog', { name: 'Please enter your password' }));
		this.toastMessages = new ToastMessages(page);
	}

	private get inputPassword() {
		return this.root.getByRole('textbox', { name: 'For your security, you must enter your current password to continue' });
	}

	private get btnVerify() {
		return this.root.getByRole('button', { name: 'Verify' });
	}

	async enterPassword(password: string): Promise<void> {
		await this.inputPassword.fill(password);
		await this.btnVerify.click();
		await this.waitForDismissal();
	}
}
