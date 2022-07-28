import fs from 'fs/promises';

import { Locator, Page } from '@playwright/test';

export class HomeContent {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	get inputMessage(): Locator {
		return this.page.locator('[name="msg"]');
	}

	get messagePopUpItems(): Locator {
		return this.page.locator('.message-popup-items');
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

	get btnModalCancel(): Locator {
		return this.page.locator('#modal-root .rcx-button-group--align-end .rcx-button--secondary');
	}

	get modalFilePreview(): Locator {
		return this.page.locator(
			'//div[@id="modal-root"]//header//following-sibling::div[1]//div//div//img | //div[@id="modal-root"]//header//following-sibling::div[1]//div//div//div//i',
		);
	}

	get btnModalConfirm(): Locator {
		return this.page.locator('#modal-root .rcx-button-group--align-end .rcx-button--primary');
	}

	get descriptionInput(): Locator {
		return this.page.locator('//div[@id="modal-root"]//fieldset//div[2]//span//input');
	}

	get getFileDescription(): Locator {
		return this.page.locator('[data-qa-type="message"]:last-child [data-qa-type="attachment-description"]');
	}

	get fileNameInput(): Locator {
		return this.page.locator('//div[@id="modal-root"]//fieldset//div[1]//span//input');
	}

	get lastMessageFileName(): Locator {
		return this.page.locator('[data-qa-type="message"]:last-child [data-qa-type="attachment-title-link"]');
	}

	get waitForLastMessageTextAttachmentEqualsText(): Locator {
		return this.page.locator('[data-qa-type="message"]:last-child .rcx-attachment__details .rcx-box--with-inline-elements');
	}

	async pickEmoji(emoji: string, section = 'icon-people') {
		await this.page.locator('.rc-message-box__icon.emoji-picker-icon').click();
		await this.page.locator(`//*[contains(@class, "emoji-picker")]//*[contains(@class, "${section}")]`).click();
		await this.page.locator(`//*[contains(@class, "emoji-picker")]//*[contains(@class, "${emoji}")]`).first().click();
	}

	async dragAndDropFile(): Promise<void> {
		const contract = await fs.readFile('./tests/e2e/fixtures/files/any_file.txt', 'utf-8');

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

	async openMessageActionMenu(): Promise<void> {
		await this.page.locator('[data-qa-type="message"]:last-child').hover();
		await this.page.locator('[data-qa-type="message"]:last-child [data-qa-type="message-action-menu"][data-qa-id="menu"]').waitFor();
		await this.page.locator('[data-qa-type="message"]:last-child [data-qa-type="message-action-menu"][data-qa-id="menu"]').click();
	}

	async selectAction(action: 'edit' | 'reply' | 'delete' | 'permalink' | 'copy' | 'quote' | 'star'): Promise<void> {
		switch (action) {
			case 'edit':
				await this.page.locator('[data-qa-id="edit-message"]').click();
				await this.page.locator('[name="msg"]').fill('this message was edited');
				await this.page.keyboard.press('Enter');
				break;
			case 'reply':
				await this.page.locator('[data-qa-id="reply-in-thread"]').click();
				break;
			case 'delete':
				await this.page.locator('[data-qa-id="delete-message"]').click();
				await this.page.locator('#modal-root .rcx-button-group--align-end .rcx-button--danger').click();
				break;
			case 'permalink':
				await this.page.locator('[data-qa-id="permalink"]').click();
				break;
			case 'copy':
				await this.page.locator('[data-qa-id="copy"]').click();
				break;
			case 'quote':
				await this.page.locator('[data-qa-id="quote-message"]').click();
				await this.page.locator('[name="msg"]').type('this is a quote message');
				await this.page.keyboard.press('Enter');
				break;
			case 'star':
				await this.page.locator('[data-qa-id="star-message"]').click();
				break;
		}
	}
}
