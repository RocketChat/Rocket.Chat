import fs from 'fs/promises';

import { Locator, Page } from '@playwright/test';

export class HomeContent {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	get btnAudioRecod(): Locator {
		return this.page.locator('[data-qa-id="audio-record"]');
	}

	get waitForLastMessageTextAttachmentEqualsText(): Locator {
		return this.page.locator('[data-qa-type="message"]:last-child .rcx-attachment__details .rcx-box--with-inline-elements');
	}

	get lastMessageRoleAdded(): Locator {
		return this.page.locator('[data-qa="system-message"] [data-qa-type="system-message-body"]').last();
	}

	get lastMessage(): Locator {
		return this.page.locator('.messages-box [data-qa-type="message"]').last();
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

	get inputMain(): Locator {
		return this.page.locator('[name="msg"]');
	}

	get btnSend(): Locator {
		return this.page.locator('.rc-message-box__icon.js-send');
	}

	get messagePopUpFirstItem(): Locator {
		return this.page.locator('.popup-item.selected');
	}

	get emojiBtn(): Locator {
		return this.page.locator('.rc-message-box__icon.emoji-picker-icon');
	}

	get emojiPickerPeopleIcon(): Locator {
		return this.page.locator('//*[contains(@class, "emoji-picker")]//*[contains(@class, "icon-people")]');
	}

	get emojiGrinning(): Locator {
		return this.page.locator('//*[contains(@class, "emoji-picker")]//*[contains(@class, "emoji-grinning")]');
	}

	get lastMessageForMessageTest(): Locator {
		return this.page.locator('[data-qa-type="message"]:last-child [data-qa-type="message-body"]');
	}

	channelTitle(title: string): Locator {
		return this.page.locator('.rcx-room-header', { hasText: title });
	}

	get modalCancelButton(): Locator {
		return this.page.locator('#modal-root .rcx-button-group--align-end .rcx-button--secondary');
	}

	get modalFilePreview(): Locator {
		return this.page.locator(
			'//div[@id="modal-root"]//header//following-sibling::div[1]//div//div//img | //div[@id="modal-root"]//header//following-sibling::div[1]//div//div//div//i',
		);
	}

	get buttonSend(): Locator {
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

	async doReload(): Promise<void> {
		await this.page.reload({ waitUntil: 'load' });
		await this.page.waitForSelector('.messages-box');
	}

	async openMoreActionMenu(): Promise<void> {
		await this.page.locator('.rc-message-box [data-qa-id="menu-more-actions"]').click();
		await this.page.waitForSelector('.rc-popover__content');
	}

	async doSelectAction(
		action: 'edit' | 'reply' | 'delete' | 'permalink' | 'copy' | 'quote' | 'star' | 'unread' | 'reaction',
	): Promise<void> {
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
			case 'unread':
				await this.page.locator('[data-id="mark-message-as-unread"][data-type="message-action"]').click();
				break;
			case 'reaction':
				await this.page.locator('[data-qa-id="reply-in-thread"]').click();
				await this.emojiPickerPeopleIcon.click();
				await this.emojiGrinning.click();
				break;
		}
	}

	async doDragAndDropFile(): Promise<void> {
		const contract = await fs.readFile('./tests/e2e/utils/fixtures/any_file.txt', 'utf-8');

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
}
