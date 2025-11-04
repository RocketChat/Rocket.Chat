import type { Page } from '@playwright/test';

import { expect } from '../../utils/test';

export class ToastMessages {
	constructor(private readonly page: Page) {}

	private readonly toastByType = {
		success: this.page.locator('.rcx-toastbar--success'),
		error: this.page.locator('.rcx-toastbar--error'),
	};

	async dismissToast(type: 'success') {
		await this.toastByType[type].locator('button >> i.rcx-icon--name-cross.rcx-icon').click();
		await this.page.mouse.move(0, 0);
	}

	private getAlertByText(text: string) {
		return this.page.locator('[role="alert"]', {
			hasText: text,
		});
	}

	waitForDisplay({ type, message }: { type: 'success' | 'error'; message?: string } = { type: 'success' }) {
		if (message) {
			return expect(this.toastByType[type].and(this.getAlertByText(message))).toBeVisible();
		}

		return expect(this.toastByType[type]).toBeVisible();
	}
}
