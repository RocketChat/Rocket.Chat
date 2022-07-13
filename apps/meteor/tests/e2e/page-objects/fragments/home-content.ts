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

	get userCardLinkProfile(): Locator {
		return this.page.locator('[data-qa="UserCard"] a');
	}
	
	get messagePopUp(): Locator {
		return this.page.locator('.message-popup');
	}

	get messagePopUpTitle(): Locator {
		return this.page.locator('.message-popup-title');
	}

	get messagePopUpItems(): Locator {
		return this.page.locator('.message-popup-items');
	}

	async setTextToInput(text: string, options: { delay?: number } = {}): Promise<void> {
		await this.page.locator('[name="msg"]').click({ clickCount: 3 });
		await this.page.keyboard.press('Backspace');
		await this.page.locator('[name="msg"]').type(text, { delay: options.delay ?? 0 });
	}

	async doSendMessage(text: string): Promise<void> {
		await this.page.locator('[name="msg"]').type(text);
		await this.page.keyboard.press('Enter');
	}

	async doOpenMessageActionMenu(): Promise<void> {
		await this.page.locator('[data-qa-type="message"]:last-child').hover();
		await this.page.locator('[data-qa-type="message"]:last-child [data-qa-type="message-action-menu"][data-qa-id="menu"]').waitFor();
		await this.page.locator('[data-qa-type="message"]:last-child [data-qa-type="message-action-menu"][data-qa-id="menu"]').click();
	}
}
