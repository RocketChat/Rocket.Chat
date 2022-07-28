import { Locator, Page } from '@playwright/test';

export class HomeContent {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	get lastUserMessage(): Locator {
		return this.page.locator('[data-qa-type="message"]').last();
	}

	get lastUserMessageNotSequential(): Locator {
		return this.page.locator('[data-qa-type="message"][data-sequential="false"]').last();
	}

	async sendMessage(text: string): Promise<void> {
		await this.page.locator('[name="msg"]').type(text);
		await this.page.keyboard.press('Enter');
	}
}
