import fs from 'fs';

import { expect, Locator } from '@playwright/test';

import BasePage from './BasePage';

class MainContent extends BasePage {
	public mainContent(): Locator {
		return this.getPage().locator('.main-content');
	}

	// Main Content Header (Channel Title Area)
	public emptyFavoriteStar(): Locator {
		return this.getPage().locator('//*[contains(@class, "rcx-room-header")]//*[contains(@class, "rcx-icon--name-star")]');
	}

	public favoriteStar(): Locator {
		return this.getPage().locator('//*[contains(@class, "rcx-room-header")]//*[contains(@class, "rcx-icon--name-star-filled")]');
	}

	public channelTitle(title: string): Locator {
		return this.getPage().locator('.rcx-room-header', { hasText: title });
	}

	// Main Content Footer (Message Input Area)
	public messageInput(): Locator {
		return this.getPage().locator('.js-input-message');
	}

	public sendBtn(): Locator {
		return this.getPage().locator('.rc-message-box__icon.js-send');
	}

	public messageBoxActions(): Locator {
		return this.getPage().locator('(//*[contains(@class, "rc-message-box__icon")])[1]');
	}

	public recordBtn(): Locator {
		return this.getPage().locator('.js-audio-message-record');
	}

	public emojiBtn(): Locator {
		return this.getPage().locator('.rc-message-box__icon.emoji-picker-icon');
	}

	public messagePopUp(): Locator {
		return this.getPage().locator('.message-popup');
	}

	public messagePopUpTitle(): Locator {
		return this.getPage().locator('.message-popup-title');
	}

	public messagePopUpItems(): Locator {
		return this.getPage().locator('.message-popup-items');
	}

	public messagePopUpFirstItem(): Locator {
		return this.getPage().locator('.popup-item.selected');
	}

	public mentionAllPopUp(): Locator {
		return this.getPage().locator('.popup-item[data-id="all"]');
	}

	public joinChannelBtn(): Locator {
		return this.getPage().locator('.button.join');
	}

	// Messages
	public lastMessageUser(): Locator {
		return this.getPage().locator('(//*[contains(@class, "message") and contains(@class, "user-card-message")])[last()]');
	}

	public lastMessageFileName(): Locator {
		return this.getPage().locator('.message:last-child > div:nth-child(3) > div:nth-child(2) > div:nth-child(1)');
	}

	public lastMessage(): Locator {
		return this.getPage().locator('.message:last-child > div:nth-child(3) > div:nth-child(2) > div:first-child');
	}

	public lastMessageDesc(): Locator {
		return this.getPage().locator('.message:last-child .body .attachment-description');
	}

	public lastMessageRoleAdded(): Locator {
		return this.getPage().locator('.message:last-child.subscription-role-added .body');
	}

	public beforeLastMessage(): Locator {
		return this.getPage().locator('.message:nth-last-child(2) .body');
	}

	public lastMessageUserTag(): Locator {
		return this.getPage().locator('.message:last-child .role-tag');
	}

	public lastMessageImg(): Locator {
		return this.getPage().locator('.message:last-child .attachment-image img');
	}

	public lastMessageTextAttachment(): Locator {
		return this.getPage().locator('.message:last-child .attachment-text');
	}

	public beforeLastMessageQuote(): Locator {
		return this.getPage().locator('.message:nth-last-child(2)');
	}

	public lastMessageQuote(): Locator {
		return this.getPage().locator('.message:last-child');
	}

	public messageOptionsBtn(): Locator {
		return this.getPage().locator('//li[@data-username="rocketchat.internal.admin.test"][last()]//div[@class="message-body-wrapper"]');
	}

	public messageOptionsBtns(): Locator {
		return this.getPage().locator('.message:last-child .message-actions');
	}

	public messageActionMenu(): Locator {
		return this.getPage().locator('.rc-popover .rc-popover__content');
	}

	public messageReply(): Locator {
		return this.getPage().locator('.message:last-child .message-actions__button[data-message-action="reply-in-thread"]');
	}

	public reply(): Locator {
		return this.getPage().locator('[data-title="Replies"]');
	}

	public messageEdit(): Locator {
		return this.getPage().locator('[data-id="edit-message"][data-type="message-action"]');
	}

	public messageDelete(): Locator {
		return this.getPage().locator('[data-id="delete-message"][data-type="message-action"]');
	}

	public messagePermalink(): Locator {
		return this.getPage().locator('[data-id="permalink"][data-type="message-action"]');
	}

	public messageCopy(): Locator {
		return this.getPage().locator('[data-id="copy"][data-type="message-action"]');
	}

	public messageQuote(): Locator {
		return this.getPage().locator('[data-id="quote-message"][data-type="message-action"]');
	}

	public messageStar(): Locator {
		return this.getPage().locator('[data-id="star-message"][data-type="message-action"]');
	}

	public messageUnread(): Locator {
		return this.getPage().locator('[data-id="mark-message-as-unread"][data-type="message-action"]');
	}

	public messageReplyInDM(): Locator {
		return this.getPage().locator('[data-id="reply-directly"][data-type="message-action"]');
	}

	// public messageReaction(): Locator { return this.getPage().locator('.message-actions__button[data-message-action="reaction-message"]'); }
	public messagePin(): Locator {
		return this.getPage().locator('[data-id="pin-message"][data-type="message-action"]');
	}
	// public messageClose(): Locator { return this.getPage().locator('[data-id="rc-popover-close"][data-type="message-action"]'); }

	// Emojis
	public emojiPickerMainScreen(): Locator {
		return this.getPage().locator('.emoji-picker');
	}

	public emojiPickerPeopleIcon(): Locator {
		return this.getPage().locator('//*[contains(@class, "emoji-picker")]//*[contains(@class, "icon-people")]');
	}

	public emojiPickerNatureIcon(): Locator {
		return this.getPage().locator('//*[contains(@class, "emoji-picker")]//*[contains(@class, "icon-nature")]');
	}

	public emojiPickerFoodIcon(): Locator {
		return this.getPage().locator('//*[contains(@class, "emoji-picker")]//*[contains(@class, "icon-food")]');
	}

	public emojiPickerActivityIcon(): Locator {
		return this.getPage().locator('//*[contains(@class, "emoji-picker")]//*[contains(@class, "icon-activity")]');
	}

	public emojiPickerTravelIcon(): Locator {
		return this.getPage().locator('.emoji-picker .icon-travel');
	}

	public emojiPickerObjectsIcon(): Locator {
		return this.getPage().locator('//*[contains(@class, "emoji-picker")]//*[contains(@class, "icon-objects")]');
	}

	public emojiPickerSymbolsIcon(): Locator {
		return this.getPage().locator('//*[contains(@class, "emoji-picker")]//*[contains(@class, "icon-symbols")]');
	}

	public emojiPickerFlagsIcon(): Locator {
		return this.getPage().locator('//*[contains(@class, "emoji-picker")]//*[contains(@class, "icon-flags")]');
	}

	public emojiPickerModifierIcon(): Locator {
		return this.getPage().locator('//*[contains(@class, "emoji-picker")]//*[contains(@class, "icon-symbols")]');
	}

	public emojiPickerChangeTone(): Locator {
		return this.getPage().locator('//*[contains(@class, "emoji-picker")]//*[contains(@class, "change-tone")]');
	}

	public emojiPickerCustomIcon(): Locator {
		return this.getPage().locator('//*[contains(@class, "emoji-picker")]//*[contains(@class, "icon-rocket")]');
	}

	public emojiPickerRecentIcon(): Locator {
		return this.getPage().locator('//*[contains(@class, "emoji-picker")]//*[contains(@class, "icon-recent")]');
	}

	public emojiPickerFilter(): Locator {
		return this.getPage().locator('//*[contains(@class, "emoji-picker")]//*[contains(@class, "js-emojipicker-search")]');
	}

	public emojiPickerEmojiContainer(): Locator {
		return this.getPage().locator('//*[contains(@class, "emoji-picker")]//*[contains(@class, "emojis")]');
	}

	public emojiGrinning(): Locator {
		return this.getPage().locator('//*[contains(@class, "emoji-picker")]//*[contains(@class, "emoji-grinning")]');
	}

	public emojiSmile(): Locator {
		return this.getPage().locator('//*[contains(@class, "emoji-picker")]//*[contains(@class, "emoji-smile")]');
	}

	public modalTitle(): Locator {
		return this.getPage().locator('#modal-root .rcx-modal__title');
	}

	public modalCancelButton(): Locator {
		return this.getPage().locator('#modal-root .rcx-button-group--align-end .rcx-button--ghost');
	}

	public buttonSend(): Locator {
		return this.getPage().locator('#modal-root .rcx-button-group--align-end .rcx-button--primary');
	}

	public modalFilePreview(): Locator {
		return this.getPage().locator(
			'//div[@id="modal-root"]//header//following-sibling::div[1]//div//div//img | //div[@id="modal-root"]//header//following-sibling::div[1]//div//div//div//i',
		);
	}

	public fileName(): Locator {
		return this.getPage().locator('//div[@id="modal-root"]//fieldset//div[1]//label');
	}

	public fileDescription(): Locator {
		return this.getPage().locator('//div[@id="modal-root"]//fieldset//div[2]//label');
	}

	// Popovermodal
	public popoverWrapper(): Locator {
		return this.getPage().locator('.rc-popover');
	}

	public async waitForLastMessageEqualsHtml(text: string): Promise<void> {
		await expect(this.getPage().locator('(//*[contains(@class, "message") and contains(@class, "body")])[last()]')).toContainText(text);
	}

	public async waitForLastMessageEqualsText(text: string): Promise<void> {
		await expect(this.getPage().locator('(//*[contains(@class, "message") and contains(@class, "body")])[last()]')).toContainText(text);
	}

	public async sendMessage(text: string): Promise<void> {
		await this.setTextToInput(text);
		await this.keyboardPress('Enter');
		await expect(
			this.getPage().locator('(//*[contains(@class, "message-body-wrapper")])[last()]/div[contains(@class, "body")]'),
		).toContainText(text);
	}

	// adds text to the input
	public async addTextToInput(text: any): Promise<void> {
		await this.messageInput().type(text);
	}

	// Clear and sets the text to the input
	public async setTextToInput(text: string): Promise<void> {
		await this.messageInput().type(text);
	}

	public async dragAndDropFile(): Promise<void> {
		const contract = await fs.promises.readFile('./tests/e2e/utils/fixtures/any_file.txt', 'utf-8');

		const dataTransfer = await this.getPage().evaluateHandle((contract) => {
			const data = new DataTransfer();
			const file = new File([`${contract}`], 'any_file.txt', {
				type: 'text/plain',
			});
			data.items.add(file);
			return data;
		}, contract);

		await this.getPage().dispatchEvent(
			'div.dropzone-overlay.dropzone-overlay--enabled.background-transparent-darkest.color-content-background-color',
			'drop',
			{ dataTransfer },
		);
	}

	public async cancelClick(): Promise<void> {
		await this.modalCancelButton().click();
	}

	public async sendFileClick(): Promise<void> {
		await this.buttonSend().click();
	}

	public descriptionInput(): Locator {
		return this.getPage().locator('//div[@id="modal-root"]//fieldset//div[2]//span//input');
	}

	public fileNameInput(): Locator {
		return this.getPage().locator('//div[@id="modal-root"]//fieldset//div[1]//span//input');
	}

	public async setFileName(): Promise<void> {
		await this.fileNameInput().fill('any_file1.txt');
	}

	public async setDescription(): Promise<void> {
		await this.descriptionInput().type('any_description');
	}

	public async selectAction(action: string): Promise<void> {
		switch (action) {
			case 'edit':
				await this.messageEdit().click();
				await this.messageInput().type('this message was edited');
				break;
			case 'reply':
				this.messageReply().click();
				break;
			case 'delete':
				await this.messageDelete().click();
				break;
			case 'permalink':
				await this.messagePermalink().click();
				break;
			case 'copy':
				await this.messageCopy().click();
				break;
			case 'quote':
				await this.messageQuote().click();
				await this.messageInput().type('this is a quote message');
				break;
			case 'star':
				await this.messageStar().click();
				break;
			case 'unread':
				await this.messageUnread().click();
				break;
			case 'reaction':
				await this.messageReply().click();
				await this.emojiPickerPeopleIcon().click();
				await this.emojiGrinning().click();
				break;
			// case 'close':
			// 	await this.messageClose().click();
			// 	break;
		}
	}

	public async openMessageActionMenu(): Promise<void> {
		await this.messageOptionsBtn().hover();
		await this.messageOptionsBtn().waitFor({ state: 'visible' });
	}
}

export default MainContent;
