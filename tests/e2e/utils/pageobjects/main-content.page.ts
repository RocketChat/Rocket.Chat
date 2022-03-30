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
		return this.getPage().locator('.message:last-child .title .user-card-message');
	}

	public lastMessage(): Locator {
		return this.getPage().locator('.message:last-child');
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
		return this.getPage().locator('.message:last-child .message-actions__menu');
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
		return this.getPage().locator('.emoji-picker .icon-people');
	}

	public emojiPickerNatureIcon(): Locator {
		return this.getPage().locator('.emoji-picker .icon-nature');
	}

	public emojiPickerFoodIcon(): Locator {
		return this.getPage().locator('.emoji-picker .icon-food');
	}

	public emojiPickerActivityIcon(): Locator {
		return this.getPage().locator('.emoji-picker .icon-activity');
	}

	public emojiPickerTravelIcon(): Locator {
		return this.getPage().locator('.emoji-picker .icon-travel');
	}

	public emojiPickerObjectsIcon(): Locator {
		return this.getPage().locator('.emoji-picker .icon-objects');
	}

	public emojiPickerSymbolsIcon(): Locator {
		return this.getPage().locator('.emoji-picker .icon-symbols');
	}

	public emojiPickerFlagsIcon(): Locator {
		return this.getPage().locator('.emoji-picker .icon-flags');
	}

	public emojiPickerModifierIcon(): Locator {
		return this.getPage().locator('.emoji-picker .icon-symbols');
	}

	public emojiPickerChangeTone(): Locator {
		return this.getPage().locator('.emoji-picker .change-tone');
	}

	public emojiPickerCustomIcon(): Locator {
		return this.getPage().locator('.emoji-picker .icon-rocket');
	}

	public emojiPickerRecentIcon(): Locator {
		return this.getPage().locator('.emoji-picker .icon-recent');
	}

	public emojiPickerFilter(): Locator {
		return this.getPage().locator('.emoji-picker .js-emojipicker-search');
	}

	public emojiPickerEmojiContainer(): Locator {
		return this.getPage().locator('.emoji-picker .emojis');
	}

	public emojiGrinning(): Locator {
		return this.getPage().locator('.emoji-picker .emoji-grinning');
	}

	public emojiSmile(): Locator {
		return this.getPage().locator('.emoji-picker .emoji-smile');
	}

	// Popover
	public popoverWrapper(): Locator {
		return this.getPage().locator('.rc-popover');
	}

	// Sends a message and wait for the message to equal the text sent
	public async sendMessage(text: any): Promise<void> {
		this.setTextToInput(text);
		await this.sendBtn().click();
		await expect(this.getPage().locator('.message:last-child .body')).toBeVisible();
		await expect(this.getPage().locator('.message:last-child .body')).toContain(text);
	}

	// adds text to the input
	public async addTextToInput(text: any): Promise<void> {
		await this.messageInput().type(text);
	}

	// Clear and sets the text to the input
	public async setTextToInput(text: any): Promise<void> {
		// cy.wait(200);
		await this.messageInput().fill('');
		if (text) {
			this.messageInput().type(text);
		}
	}
}

export default MainContent;
