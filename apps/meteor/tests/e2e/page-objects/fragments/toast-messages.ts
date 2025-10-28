import type { Page } from '@playwright/test';

export class ToastMessages {
	constructor(private readonly page: Page) {}

	private readonly toastByType = {
		success: this.page.locator('.rcx-toastbar.rcx-toastbar--success'),
	};

	async dismissToast(type: 'success') {
		await this.toastByType[type].locator('button >> i.rcx-icon--name-cross.rcx-icon').click();
		await this.page.mouse.move(0, 0);
	}
}
