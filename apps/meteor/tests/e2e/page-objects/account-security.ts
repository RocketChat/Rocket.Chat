import type { Page } from '@playwright/test';

import { ToastMessages } from './fragments/toast-messages';

export class AccountSecurityPage {
	private readonly toastMessages: ToastMessages;

	constructor(protected readonly page: Page) {
		this.toastMessages = new ToastMessages(page);
	}

	goto() {
		return this.page.goto('/account/security');
	}

	private get expandE2EESectionButton() {
		return this.page.getByRole('button', { name: 'End-to-end encryption' });
	}

	private get resetE2EEPasswordButton() {
		return this.page.getByRole('button', { name: 'Reset E2EE key' });
	}

	private get newE2EEPasswordInput() {
		return this.page.getByRole('textbox', { name: 'New encryption password' });
	}

	private get confirmNewE2EEPasswordInput() {
		return this.page.getByRole('textbox', { name: 'Confirm new encryption password' });
	}

	private get saveChangesButton() {
		return this.page.getByRole('button', { name: 'Save changes' });
	}

	private get closeButton() {
		return this.page.getByRole('navigation').getByRole('button', { name: 'Close' });
	}

	async resetE2EEPassword() {
		await this.expandE2EESectionButton.click();
		await this.resetE2EEPasswordButton.click();
		await this.toastMessages.dismissToast('success');
		// Logged out
	}

	async setE2EEPassword(newPassword: string) {
		await this.expandE2EESectionButton.click();

		await this.newE2EEPasswordInput.fill(newPassword);
		await this.confirmNewE2EEPasswordInput.fill(newPassword);
		await this.saveChangesButton.click();
		await this.toastMessages.dismissToast('success');
	}

	async close() {
		await this.closeButton.click();
	}
}
