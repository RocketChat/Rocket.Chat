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
}
