import type { Page } from '@playwright/test';

import { expect } from '../../utils/test';

export class ToastMessages {
	constructor(private readonly page: Page) {}

	private readonly toastByType = {
		success: this.page.locator('.rcx-toastbar--success'),
		error: this.page.locator('.rcx-toastbar--error'),
	};

	async dismissToast(type: 'success' | 'error' = 'success') {
		await this.toastByType[type].last().getByRole('button', { name: 'Dismiss alert' }).click();
		await this.page.mouse.move(0, 0);
	}

	waitForDisplay({ type, message }: { type: 'success' | 'error'; message?: string } = { type: 'success' }) {
		if (message) {
			return expect(
				this.toastByType[type].last().locator('[role="alert"]', {
					hasText: message,
				}),
			).toBeVisible();
		}

		return expect(this.toastByType[type].last()).toBeVisible();
	}
}
