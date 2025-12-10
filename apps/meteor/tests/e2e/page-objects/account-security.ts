import type { Locator, Page } from '@playwright/test';

import { Account } from './account';
import { EnterPasswordModal } from './fragments/enter-password-modal';

export class AccountSecurity extends Account {
	private readonly enterPasswordModal: EnterPasswordModal;

	constructor(page: Page) {
		super(page);
		this.enterPasswordModal = new EnterPasswordModal(page);
	}

	goto() {
		return this.page.goto('/account/security');
	}

	get inputNewPassword() {
		return this.page.getByRole('textbox', { name: 'New password' });
	}

	private get inputConfirmPassword() {
		return this.page.getByRole('textbox', { name: 'Confirm password' });
	}

	async changePassword(newPassword: string, confirmPassword: string, currentPassword: string) {
		await this.inputNewPassword.fill(newPassword);
		await this.inputConfirmPassword.fill(confirmPassword);
		await this.saveChangesButton.click();
		await this.enterPasswordModal.enterPassword(currentPassword);
	}

	private get expandE2EESectionButton() {
		return this.page.getByRole('button', { name: 'End-to-end encryption' });
	}

	private get resetE2EEPasswordButton() {
		return this.page.getByRole('button', { name: 'Reset E2EE password' });
	}

	private get newE2EEPasswordInput() {
		return this.page.getByRole('textbox', { name: 'New E2EE password' });
	}

	private get confirmNewE2EEPasswordInput() {
		return this.page.getByRole('textbox', { name: 'Confirm new E2EE password' });
	}

	get securityHeader(): Locator {
		return this.page.locator('h1[data-qa-type="PageHeader-title"]:has-text("Security")');
	}

	get securityPasswordSection(): Locator {
		return this.page.locator('[role="button"]:has-text("Password")');
	}

	get security2FASection(): Locator {
		return this.page.locator('[role="button"]:has-text("Two Factor Authentication")');
	}

	get securityE2EEncryptionSection(): Locator {
		return this.page.locator('[role="button"]:has-text("End-to-end encryption")');
	}

	get securityE2EEncryptionResetKeyButton(): Locator {
		return this.page.locator("role=button[name='Reset E2EE password']");
	}

	get securityE2EEncryptionSavePasswordButton(): Locator {
		return this.page.locator("role=button[name='Save changes']");
	}

	get email2FASwitch(): Locator {
		return this.page.locator('label', { has: this.page.getByRole('checkbox', { name: 'Two-factor authentication via email' }) });
	}

	get totp2FASwitch(): Locator {
		return this.page.locator('label', { has: this.page.getByRole('checkbox', { name: 'Two-factor authentication via TOTP' }) });
	}

	get required2faModalSetUpButton(): Locator {
		return this.page.locator('dialog >> button');
	}

	async resetE2EEPassword() {
		await this.expandE2EESectionButton.click();
		await this.resetE2EEPasswordButton.click();
		await this.toastMessage.dismissToast('success');
		// Logged out
	}

	async setE2EEPassword(newPassword: string) {
		await this.expandE2EESectionButton.click();
		await this.newE2EEPasswordInput.fill(newPassword);
		await this.confirmNewE2EEPasswordInput.fill(newPassword);
		await this.saveChangesButton.click();
		await this.toastMessage.dismissToast('success');
	}

	async close() {
		await this.sidebar.close();
	}
}
