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
		return this.page.locator('#toast-container');
	}

	get toastBar(): Locator {
		return this.page.locator('.rcx-toastbar');
	}

	get toastBarError(): Locator {
		return this.page.locator('.rcx-toastbar.rcx-toastbar--error');
	}

	get toastBarSuccess(): Locator {
		return this.page.locator('.rcx-toastbar.rcx-toastbar--success');
	}

	get modalConfirm(): Locator {
		return this.page.locator('.rcx-modal .rcx-button--primary-danger');
	}

	async keyPress(key: string): Promise<void> {
		await this.page.keyboard.press(key);
	}

	async doDismissToastBar(): Promise<void> {
		await this.toastBar.locator('button').click();
	}
}
