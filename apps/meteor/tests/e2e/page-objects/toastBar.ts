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

	get error(): Locator {
		return this.page.locator('.rcx-toastbar.rcx-toastbar--error');
	}

	get dismiss(): Locator {
		return this.content.getByRole('button', { name: 'Dismiss alert', exact: true });
	}

	async waitForError(): Promise<boolean> {
		try {
			await this.error.waitFor({ timeout: 1000 });

			return false;
		} catch (error) {
			return true;
		}
	}
}
