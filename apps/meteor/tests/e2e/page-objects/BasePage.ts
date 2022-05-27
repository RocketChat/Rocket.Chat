import { Locator, Page } from '@playwright/test';

export abstract class BasePage {
	protected readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	get toast(): Locator {
		return this.page.locator('.toast');
	}

	get toastSuccess(): Locator {
		return this.page.locator('.toast-message');
	}

	get modalConfirm(): Locator {
		return this.page.locator('.rcx-modal .rcx-button--primary-danger');
	}

	async keyPress(key: string): Promise<void> {
		await this.page.keyboard.press(key);
	}
}
