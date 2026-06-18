import type { Page } from 'playwright-core';

import { Modal } from './modal';
import { ToastMessages } from '../toast-messages';

export class EditStatusModal extends Modal {
	readonly toastMessages: ToastMessages;

	constructor(page: Page) {
		super(page.getByRole('dialog', { name: 'Set your status' }), page);
		this.toastMessages = new ToastMessages(page);
	}

	private get statusMessageInput() {
		return this.root.getByRole('textbox', { name: 'Status' });
	}

	private get statusTypeButton() {
		return this.root.getByRole('button', { name: 'User status menu' });
	}

	private get durationSelect() {
		return this.root.getByLabel('Clear status after');
	}

	get customDateInput() {
		return this.root.getByLabel('Expiration date');
	}

	get customTimeInput() {
		return this.root.getByLabel('Expiration time');
	}

	get btnSubmit() {
		return this.root.getByRole('button', { name: 'Save' });
	}

	get durationError() {
		return this.root.getByText('Expiration must be in the future');
	}

	get durationMissingError() {
		return this.root.locator('.rcx-field__error', { hasText: 'Choose date and time' });
	}

	async selectStatusType(status: string): Promise<void> {
		await this.statusTypeButton.click();
		await this.page!.getByRole('option', { name: status }).click();
	}

	async selectDuration(duration: string): Promise<void> {
		await this.durationSelect.click();
		await this.page!.getByRole('option', { name: new RegExp(duration) }).click();
	}

	async changeStatusMessage(statusMessage?: string): Promise<void> {
		if (statusMessage !== undefined) {
			await this.statusMessageInput.fill(statusMessage);
		}
		await this.save();
		await this.toastMessages.dismissToast();
	}

	async setStatusWithExpiration({
		message,
		statusType,
		duration,
		customDate,
		customTime,
	}: {
		message?: string;
		statusType?: string;
		duration: string;
		customDate?: string;
		customTime?: string;
	}): Promise<void> {
		if (statusType) {
			await this.selectStatusType(statusType);
		}
		if (message !== undefined) {
			await this.statusMessageInput.fill(message);
		}
		await this.selectDuration(duration);
		if (customDate) {
			await this.customDateInput.fill(customDate);
		}
		if (customTime) {
			await this.customTimeInput.fill(customTime);
		}
		await this.save();
		await this.toastMessages.dismissToast();
	}
}
