import type { Locator, Page } from '@playwright/test';

export class Utils {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	get mainContent(): Locator {
		return this.page.locator('#main-content');
	}

	get toastBarSuccess(): Locator {
		return this.page.locator('.rcx-toastbar.rcx-toastbar--success');
	}

	getAlertByText(text: string): Locator {
		return this.page.locator('[role="alert"]', {
			hasText: text,
		});
	}
}
