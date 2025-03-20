import type { Locator, Page } from '@playwright/test';

export class Utils {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	get mainContent(): Locator {
		return this.page.locator('main.main-content');
	}

	get toastBar(): Locator {
		return this.page.locator('.rcx-toastbar');
	}

	get toastBarSuccess(): Locator {
		return this.page.locator('.rcx-toastbar.rcx-toastbar--success');
	}

	get toastBarError(): Locator {
		return this.page.locator('.rcx-toastbar.rcx-toastbar--error');
	}

	get btnModalConfirmDelete() {
		return this.page.locator('.rcx-modal >> button >> text="Delete"');
	}

	getAlertByText(text: string): Locator {
		return this.page.locator('[role="alert"]', {
			hasText: text,
		});
	}
}
