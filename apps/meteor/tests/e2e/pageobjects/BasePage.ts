import { Page } from '@playwright/test';

export class BasePage {
	public page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	async keyboardPress(key: string): Promise<void> {
		await this.page.keyboard.press(key);
	}
}
