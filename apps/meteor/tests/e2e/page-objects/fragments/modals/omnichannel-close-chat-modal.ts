import type { Locator, Page } from '@playwright/test';

import { Modal } from './modal';
import { ToastMessages } from '../toast-messages';

export class OmnichannelCloseChatModal extends Modal {
	private readonly toastMessages: ToastMessages;

	constructor(page: Page) {
		super(page.getByRole('dialog', { name: 'Wrap up conversation' }));
		this.toastMessages = new ToastMessages(page);
	}

	private get inputComment(): Locator {
		return this.root.locator('input[name="comment"]');
	}

	private get btnConfirm(): Locator {
		return this.root.locator('role=button[name="Confirm"]');
	}

	private get labelPDF(): Locator {
		return this.root.locator('label[for="transcript-pdf"]');
	}

	async confirm(comment: string, downloadPDF: boolean): Promise<void> {
		await this.inputComment.fill(comment);
		if (downloadPDF) {
			await this.labelPDF.click();
		}
		await this.btnConfirm.click();
		await this.waitForDismissal();
		await this.toastMessages.dismissToast('success');
	}
}
