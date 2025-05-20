import type { Locator, Page } from '@playwright/test';

import { Modal } from './modal';
import { ToastMessages } from './toast-messages';
import { expect } from '../../utils/test';

abstract class E2EEBanner {
	constructor(protected root: Locator) {}

	click() {
		return this.root.click();
	}

	async waitForDisappearance() {
		await expect(this.root).not.toBeVisible();
	}
}

export class SaveE2EEPasswordBanner extends E2EEBanner {
	constructor(page: Page) {
		super(page.getByRole('button', { name: 'Save your encryption password' }));
	}
}

export class EnterE2EEPasswordBanner extends E2EEBanner {
	constructor(page: Page) {
		// TODO: there is a typo in the default translation
		super(page.getByRole('button', { name: 'Enter your E2E password' }));
	}
}

export class E2EEKeyDecodeFailureBanner extends E2EEBanner {
	constructor(page: Page) {
		super(page.getByRole('button', { name: "Wasn't possible to decode your encryption key to be imported." }));
	}

	async expectToNotBeVisible() {
		await expect(this.root).not.toBeVisible();
	}
}

export class SaveE2EEPasswordModal extends Modal {
	private readonly toastMessages: ToastMessages;

	constructor(page: Page) {
		super(page.getByRole('dialog', { name: 'Save your encryption password' }));
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

export class EnterE2EEPasswordModal extends Modal {
	constructor(page: Page) {
		super(page.getByRole('dialog', { name: 'Enter E2EE password' }));
	}

	private get passwordInput() {
		return this.root.getByPlaceholder('Please enter your E2EE password');
	}

	private get enterE2EEPasswordButton() {
		return this.root.getByRole('button', { name: 'Enable encryption' });
	}

	async enterPassword(password: string) {
		await this.passwordInput.fill(password);
		await this.enterE2EEPasswordButton.click();
		await this.waitForDismissal();
	}
}

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
