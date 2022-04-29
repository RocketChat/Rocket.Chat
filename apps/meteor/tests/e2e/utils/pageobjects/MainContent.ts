import { expect, Locator } from '@playwright/test';

import BasePage from './BasePage';

export default class MainContent extends BasePage {
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

	// Messages
	public lastMessageUser(): Locator {
		return this.getPage().locator('(//*[contains(@class, "message") and contains(@class, "user-card-message")])[last()]');
	}

	public lastMessage(): Locator {
		return this.getPage().locator('.message:last-child');
	}

	public lastMessageRoleAdded(): Locator {
		return this.getPage().locator('.message:last-child.subscription-role-added .body');
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

	public emojiPickerChangeTone(): Locator {
		return this.getPage().locator('//*[contains(@class, "emoji-picker")]//*[contains(@class, "change-tone")]');
	}

	public emojiPickerCustomIcon(): Locator {
		return this.getPage().locator('//*[contains(@class, "emoji-picker")]//*[contains(@class, "icon-rocket")]');
	}

	public emojiPickerFilter(): Locator {
		return this.getPage().locator('//*[contains(@class, "emoji-picker")]//*[contains(@class, "js-emojipicker-search")]');
	}

	public emojiGrinning(): Locator {
		return this.getPage().locator('//*[contains(@class, "emoji-picker")]//*[contains(@class, "emoji-grinning")]');
	}

	public emojiSmile(): Locator {
		return this.getPage().locator('//*[contains(@class, "emoji-picker")]//*[contains(@class, "emoji-smile")]');
	}

	public async waitForLastMessageEqualsHtml(text: string): Promise<void> {
		await expect(this.getPage().locator('(//*[contains(@class, "message") and contains(@class, "body")])[last()]')).toContainText(text);
	}

	public async waitForLastMessageEqualsText(text: string): Promise<void> {
		await expect(this.getPage().locator('(//*[contains(@class, "message") and contains(@class, "body")])[last()]')).toContainText(text);
	}

	public async sendMessage(text: any): Promise<void> {
		await this.setTextToInput(text);
		await this.sendBtn().click();
		await expect(
			this.getPage().locator('(//*[contains(@class, "message-body-wrapper")])[last()]/div[contains(@class, "body")]'),
		).toContainText(text);
	}

	public async addTextToInput(text: any): Promise<void> {
		await this.messageInput().type(text);
	}

	public async setTextToInput(text: any): Promise<void> {
		await this.messageInput().fill('');

		if (text) {
			await this.messageInput().type(text);
		}
	}
}
