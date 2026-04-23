import type { Locator, Page } from '@playwright/test';

import { Modal } from './modal';
import { expect } from '../../../utils/test';
import { ToastMessages } from '../toast-messages';

export class ReportMessageModal extends Modal {
	readonly toastMessage: ToastMessages;

	constructor(page: Page) {
		super(page.getByRole('dialog', { name: 'Report message' }));
		this.toastMessage = new ToastMessages(page);
	}

	get inputReportDescription(): Locator {
		return this.root.getByRole('textbox', { name: 'Report reason' });
	}

	private get btnSubmitReport(): Locator {
		return this.root.getByRole('button', { name: 'Report' });
	}

	private get btnCancelReport(): Locator {
		return this.root.getByRole('button', { name: 'Cancel' });
	}

	private get alertInputDescription(): Locator {
		return this.root.getByRole('alert');
	}

	async cancelReport(): Promise<void> {
		await this.btnCancelReport.click();
		await this.waitForDismissal();
	}

	async submitReport(description?: string): Promise<void> {
		if (!description) {
			await this.btnSubmitReport.click();
			await expect(this.alertInputDescription).toBeVisible();
			return;
		}

		await this.inputReportDescription.fill(description);
		await this.btnSubmitReport.click();
		await this.waitForDismissal();
		await this.toastMessage.waitForDisplay({ type: 'success', message: 'Report has been sent' });
	}
}
