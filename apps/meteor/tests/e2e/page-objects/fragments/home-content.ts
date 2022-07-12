import fs from 'fs';

import { Page, Locator } from '@playwright/test';

export class HomeContent {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	get lastUserMessage(): Locator {
		return this.page.locator('[data-own="false"][data-qa-type="message"]').last();
	}

	get lastUserMessageNotSequential(): Locator {
		return this.page.locator('[data-qa-id=UserMessage]:not(.sequential)').last();
	}

	getUserMessage(name: string): Locator {
		return this.page.locator(`[data-username="${name}"][data-qa-type="username"]`).last();
	}

	getUserFigure(name: string): Locator {
		return this.page.locator(`figure[data-username="${name}"]`).last();
	}

	get inputMessage(): Locator {
		return this.page.locator('[name="msg"]');
	}

	get popupMessage(): Locator {
		return this.page.locator('.message-popup');
	}

	get announcementTitle(): Locator {
		return this.page.locator('[data-qa="AnnouncementAnnoucementComponent"]');
	}

	get btnFullProfile(): Locator {
		return this.page.locator('[data-qa="UserCard"] a');
	}

	get btnStarMessage(): Locator {
		return this.page.locator('[data-qa-id="star-message"]');
	}

	getSystemMessage(text: string): Locator {
		return this.page.locator(`[data-qa-type="system-message-body"] >> text="${text}"`).last();
	}

	async doSendMessage(text: string): Promise<void> {
		await this.inputMessage.type(text);
		await this.page.keyboard.press('Enter');
	}

	async doDropFileInChat(): Promise<void> {
		const contract = await fs.promises.readFile('./tests/e2e/fixtures/any_file.txt', 'utf-8');

		const dataTransfer = await this.page.evaluateHandle((contract) => {
			const data = new DataTransfer();
			const file = new File([`${contract}`], 'any_file.txt', {
				type: 'text/plain',
			});
			data.items.add(file);
			return data;
		}, contract);

		await this.page.dispatchEvent(
			'div.dropzone-overlay.dropzone-overlay--enabled.background-transparent-darkest.color-content-background-color',
			'drop',
			{ dataTransfer },
		);
	}

	async doMessageActionMenu(): Promise<void> {
		await this.page.locator('.messages-box [data-qa-type="message"]:last-child').hover();
		await this.page.locator('.messages-box [data-qa-type="message"]:last-child [data-qa-id="menu"]').waitFor();
		await this.page.locator('.messages-box [data-qa-type="message"]:last-child [data-qa-id="menu"]').click();
	}
}
