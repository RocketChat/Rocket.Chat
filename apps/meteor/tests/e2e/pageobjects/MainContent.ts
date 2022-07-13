import fs from 'fs';

import { expect, Locator } from '@playwright/test';

import { BasePage } from './BasePage';

export class MainContent extends BasePage {
	get mainContent(): Locator {
		return this.page.locator('.main-content');
	}

	get emptyFavoriteStar(): Locator {
		return this.page.locator('//*[contains(@class, "rcx-room-header")]//*[contains(@class, "rcx-icon--name-star")]');
	}

	get favoriteStar(): Locator {
		return this.page.locator('//*[contains(@class, "rcx-room-header")]//*[contains(@class, "rcx-icon--name-star-filled")]');
	}

	channelTitle(title: string): Locator {
		return this.page.locator('.rcx-room-header', { hasText: title });
	}

	get messageInput(): Locator {
		return this.page.locator('[name="msg"]');
	}

	get sendBtn(): Locator {
		return this.page.locator('.rc-message-box__icon.js-send');
	}

	get messageBoxActions(): Locator {
		return this.page.locator('(//*[contains(@class, "rc-message-box__icon")])[1]');
	}

	get recordBtn(): Locator {
		return this.page.locator('[data-qa-id="audio-record"]');
	}

	get emojiBtn(): Locator {
		return this.page.locator('.rc-message-box__icon.emoji-picker-icon');
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

	get messagePopUpFirstItem(): Locator {
		return this.page.locator('.popup-item.selected');
	}

	get lastUserMessage(): Locator {
		return this.page.locator('[data-qa-type="message"][data-sequential="false"]').last().locator('[data-qa-type="username"]');
	}

	get btnLastUserMessage(): Locator {
		return this.page.locator('[data-qa-type="message"][data-sequential="false"]').last().locator('[data-qa-type="username"]');
	}

	get lastMessageFileName(): Locator {
		return this.page.locator('[data-qa-type="message"]:last-child [data-qa-type="attachment-title-link"]');
	}

	get lastMessage(): Locator {
		return this.page.locator('.messages-box [data-qa-type="message"]').last();
	}

	get lastMessageRoleAdded(): Locator {
		const roleAddedMessageRegex = new RegExp(/\badded by\b/g);
		return this.page.locator('[data-qa="system-message"] [data-qa-type="system-message-body"]', { hasText: roleAddedMessageRegex });
	}

	get lastMessageUserTag(): Locator {
		return this.page.locator('.message:last-child .role-tag');
	}

	get lastMessageForMessageTest(): Locator {
		return this.page.locator('[data-qa-type="message"]:last-child [data-qa-type="message-body"]');
	}

	get messageOptionsBtns(): Locator {
		return this.page.locator('.message:last-child .message-actions');
	}

	get messageReply(): Locator {
		return this.page.locator('[data-qa-id="reply-in-thread"]');
	}

	get messageEdit(): Locator {
		return this.page.locator('[data-qa-id="edit-message"]');
	}

	get messageDelete(): Locator {
		return this.page.locator('[data-qa-id="delete-message"]');
	}

	get messagePermalink(): Locator {
		return this.page.locator('[data-qa-id="permalink"]');
	}

	get messageCopy(): Locator {
		return this.page.locator('[data-qa-id="copy"]');
	}

	get messageQuote(): Locator {
		return this.page.locator('[data-qa-id="quote-message"]');
	}

	get messageStar(): Locator {
		return this.page.locator('[data-qa-id="star-message"]');
	}

	get messageUnread(): Locator {
		return this.page.locator('[data-id="mark-message-as-unread"][data-type="message-action"]');
	}

	get emojiPickerMainScreen(): Locator {
		return this.page.locator('.emoji-picker');
	}

	get emojiPickerPeopleIcon(): Locator {
		return this.page.locator('//*[contains(@class, "emoji-picker")]//*[contains(@class, "icon-people")]');
	}

	get emojiPickerNatureIcon(): Locator {
		return this.page.locator('//*[contains(@class, "emoji-picker")]//*[contains(@class, "icon-nature")]');
	}

	get emojiPickerFoodIcon(): Locator {
		return this.page.locator('//*[contains(@class, "emoji-picker")]//*[contains(@class, "icon-food")]');
	}

	get emojiPickerActivityIcon(): Locator {
		return this.page.locator('//*[contains(@class, "emoji-picker")]//*[contains(@class, "icon-activity")]');
	}

	get emojiPickerTravelIcon(): Locator {
		return this.page.locator('.emoji-picker .icon-travel');
	}

	get emojiPickerObjectsIcon(): Locator {
		return this.page.locator('//*[contains(@class, "emoji-picker")]//*[contains(@class, "icon-objects")]');
	}

	get emojiPickerSymbolsIcon(): Locator {
		return this.page.locator('//*[contains(@class, "emoji-picker")]//*[contains(@class, "icon-symbols")]');
	}

	get emojiPickerFlagsIcon(): Locator {
		return this.page.locator('//*[contains(@class, "emoji-picker")]//*[contains(@class, "icon-flags")]');
	}

	get emojiPickerCustomIcon(): Locator {
		return this.page.locator('//*[contains(@class, "emoji-picker")]//*[contains(@class, "icon-rocket")]');
	}

	get emojiPickerFilter(): Locator {
		return this.page.locator('//*[contains(@class, "emoji-picker")]//*[contains(@class, "js-emojipicker-search")]');
	}

	get emojiPickerChangeTone(): Locator {
		return this.page.locator('//*[contains(@class, "emoji-picker")]//*[contains(@class, "change-tone")]');
	}

	get emojiGrinning(): Locator {
		return this.page.locator('//*[contains(@class, "emoji-picker")]//*[contains(@class, "emoji-grinning")]');
	}

	get emojiSmile(): Locator {
		return this.page.locator('//*[contains(@class, "emoji-picker")]//*[contains(@class, "emoji-smile")]');
	}

	get modalTitle(): Locator {
		return this.page.locator('#modal-root .rcx-modal__title');
	}

	get modalCancelButton(): Locator {
		return this.page.locator('#modal-root .rcx-button-group--align-end .rcx-button--secondary');
	}

	get modalDeleteMessageButton(): Locator {
		return this.page.locator('#modal-root .rcx-button-group--align-end .rcx-button--danger');
	}

	get buttonSend(): Locator {
		return this.page.locator('#modal-root .rcx-button-group--align-end .rcx-button--primary');
	}

	get modalFilePreview(): Locator {
		return this.page.locator(
			'//div[@id="modal-root"]//header//following-sibling::div[1]//div//div//img | //div[@id="modal-root"]//header//following-sibling::div[1]//div//div//div//i',
		);
	}

	get fileName(): Locator {
		return this.page.locator('//div[@id="modal-root"]//fieldset//div[1]//label');
	}

	get fileDescription(): Locator {
		return this.page.locator('//div[@id="modal-root"]//fieldset//div[2]//label');
	}

	async waitForLastMessageEqualsHtml(text: string): Promise<void> {
		await expect(this.lastMessageForMessageTest).toContainText(text);
	}

	async waitForLastMessageEqualsText(text: string): Promise<void> {
		await expect(this.lastMessage).toContainText(text);
	}

	async sendMessage(text: string): Promise<void> {
		await this.setTextToInput(text);
		await this.keyboardPress('Enter');
	}

	async addTextToInput(text: any): Promise<void> {
		await this.messageInput.type(text);
	}

	async setTextToInput(text: string, options: { delay?: number } = {}): Promise<void> {
		await this.messageInput.click({ clickCount: 3 });
		await this.page.keyboard.press('Backspace');
		await this.messageInput.type(text, { delay: options.delay ?? 0 });
	}

	async dragAndDropFile(): Promise<void> {
		const contract = await fs.promises.readFile('./tests/e2e/utils/fixtures/any_file.txt', 'utf-8');

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

	async sendFileClick(): Promise<void> {
		await this.buttonSend.click();
	}

	get descriptionInput(): Locator {
		return this.page.locator('//div[@id="modal-root"]//fieldset//div[2]//span//input');
	}

	get fileNameInput(): Locator {
		return this.page.locator('//div[@id="modal-root"]//fieldset//div[1]//span//input');
	}

	async setFileName(): Promise<void> {
		await this.fileNameInput.fill('any_file1.txt');
	}

	async setDescription(): Promise<void> {
		await this.descriptionInput.type('any_description');
	}

	get getFileDescription(): Locator {
		return this.page.locator('[data-qa-type="message"]:last-child [data-qa-type="attachment-description"]');
	}

	async selectAction(action: string): Promise<void> {
		switch (action) {
			case 'edit':
				await this.messageEdit.click();
				await this.messageInput.fill('this message was edited');
				await this.keyboardPress('Enter');
				await expect(this.lastMessageForMessageTest).toHaveText('this message was edited');
				break;
			case 'reply':
				this.messageReply.click();
				break;
			case 'delete':
				await this.messageDelete.click();
				await this.acceptDeleteMessage();
				await expect(this.lastMessageForMessageTest).not.toHaveText('Message for Message Delete Tests');
				break;
			case 'permalink':
				await this.messagePermalink.click();
				break;
			case 'copy':
				await this.messageCopy.click();
				break;
			case 'quote':
				await this.messageQuote.click();
				await this.messageInput.type('this is a quote message');
				await this.keyboardPress('Enter');
				break;
			case 'star':
				await this.messageStar.click();
				await expect(this.page.locator('div.rcx-toastbar:has-text("Message has been starred")')).toBeVisible();
				break;
			case 'unread':
				await this.messageUnread.click();
				break;
			case 'reaction':
				await this.messageReply.click();
				await this.emojiPickerPeopleIcon.click();
				await this.emojiGrinning.click();
				break;
		}
	}

	async openMessageActionMenu(): Promise<void> {
		await this.page.locator('[data-qa-type="message"]:last-child').hover();
		await this.page.locator('[data-qa-type="message"]:last-child [data-qa-type="message-action-menu"][data-qa-id="menu"]').waitFor();
		await this.page.locator('[data-qa-type="message"]:last-child [data-qa-type="message-action-menu"][data-qa-id="menu"]').click();
	}

	async openMoreActionMenu(): Promise<void> {
		await this.page.locator('.rc-message-box [data-qa-id="menu-more-actions"]').click();
		await this.page.waitForSelector('.rc-popover__content');
	}

	async acceptDeleteMessage(): Promise<void> {
		await this.modalDeleteMessageButton.click();
	}

	get waitForLastMessageTextAttachmentEqualsText(): Locator {
		return this.page.locator('[data-qa-type="message"]:last-child .rcx-attachment__details .rcx-box--with-inline-elements');
	}

	get userCard(): Locator {
		return this.page.locator('[data-qa="UserCard"]');
	}

	get viewUserProfile(): Locator {
		return this.page.locator('[data-qa="UserCard"] a');
	}

	async doReload(): Promise<void> {
		await this.page.reload({ waitUntil: 'load' });
		await this.page.waitForSelector('.messages-box');
	}
}
