import type { Page } from '@playwright/test';

import { Modal } from './modal';

export class EnterE2EEPasswordModal extends Modal {
	constructor(page: Page) {
		super(page.getByRole('dialog', { name: 'Enter E2EE password' }));
	}

	private get passwordInput() {
		return this.root.getByPlaceholder('Please enter your E2EE password');
	}

	private get forgotPasswordLink() {
		return this.root.getByRole('link', { name: 'Forgot E2EE password?' });
	}

	private get enterE2EEPasswordButton() {
		return this.root.getByRole('button', { name: 'Enable encryption' });
	}

	async enterPassword(password: string) {
		await this.passwordInput.fill(password);
		await this.enterE2EEPasswordButton.click();
		await this.waitForDismissal();
	}

	async forgotPassword() {
		await this.forgotPasswordLink.click();
		await this.waitForDismissal();
	}
}
