import type { Locator, Page } from '@playwright/test';

export class ToastBar {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	get content(): Locator {
		return this.page.locator('.rcx-toastbar');
	}

	get alert(): Locator {
		return this.content.getByRole('alert');
	}

	get dismiss(): Locator {
		return this.content.getByRole('button', { name: 'Dismiss alert', exact: true });
	}

	async waitForError(): Promise<boolean> {
		let timeoutOccurred = false;

		try {
			await this.page.waitForSelector('.rcx-toastbar.rcx-toastbar--error', { timeout: 5000 });

			timeoutOccurred = false;
		} catch (error: unknown) {
			if ((error as { name: string }).name === 'TimeoutError') {
				timeoutOccurred = true;
			} else {
				throw error;
			}
		}

		return timeoutOccurred;
	}
}
