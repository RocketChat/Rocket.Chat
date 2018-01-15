import Page from './Page';

class MainContent extends Page {

	get mainContent() { return browser.element('.main-content'); }

	// Main Content Header (Channel Title Area)
	get emptyFavoriteStar() { return browser.element('.toggle-favorite .icon-star-empty'); }
	get favoriteStar() { return browser.element('.toggle-favorite .favorite-room'); }
	get channelTitle() { return browser.element('.room-title'); }

	//Main Content Footer (Message Input Area)
	get messageInput() { return browser.element('.rc-message-box__container textarea'); }
	get sendBtn() { return browser.element('.rc-message-box__icon.js-send'); }
	get messageBoxActions() { return browser.element('.rc-message-box__icon'); }
	get recordBtn() { return browser.element('.message-buttons .icon-mic'); }
	get videoCamBtn() { return browser.element('.message-buttons .icon-videocam'); }
	get emojiBtn() { return browser.element('.rc-message-box__icon.emoji-picker-icon'); }
	get messagePopUp() { return browser.element('.message-popup'); }
	get messagePopUpTitle() { return browser.element('.message-popup-title'); }
	get messagePopUpItems() { return browser.element('.message-popup-items'); }
	get messagePopUpFirstItem() { return browser.element('.popup-item.selected'); }
	get mentionAllPopUp() { return browser.element('.popup-item[data-id="all"]'); }
	get joinChannelBtn() { return browser.element('.button.join'); }

	// Messages
	get lastMessageUser() { return browser.element('.message:last-child .user-card-message:nth-of-type(2)'); }
	get lastMessage() { return browser.element('.message:last-child .body'); }
	get lastMessageDesc() { return browser.element('.message:last-child .body .attachment-description'); }
	get lastMessageRoleAdded() { return browser.element('.message:last-child.subscription-role-added .body'); }
	get beforeLastMessage() { return browser.element('.message:nth-last-child(2) .body'); }
	get lastMessageUserTag() { return browser.element('.message:last-child .role-tag'); }
	get lastMessageImg() { return browser.element('.message:last-child .attachment-image img'); }
	get lastMessageTextAttachment() { return browser.element('.message:last-child .attachment-text'); }
	get messageOptionsBtn() { return browser.element('.message:last-child .message-actions__menu'); }
	get messageActionMenu() { return browser.element('.rc-popover__content'); }
	get messageReply() { return browser.element('[data-id="reply-message"][data-type="message-action"]'); }
	get messageEdit() { return browser.element('[data-id="edit-message"][data-type="message-action"]'); }
	get messageDelete() { return browser.element('[data-id="delete-message"][data-type="message-action"]'); }
	get messagePermalink() { return browser.element('[data-id="permalink"][data-type="message-action"]'); }
	get messageCopy() { return browser.element('[data-id="copy"][data-type="message-action"]'); }
	get messageQuote() { return browser.element('[data-id="quote-message"][data-type="message-action"]'); }
	get messageStar() { return browser.element('[data-id="star-message"][data-type="message-action"]'); }
	get messageUnread() { return browser.element('[data-id="mark-message-as-unread"][data-type="message-action"]'); }
	// get messageReaction() { return browser.element('.message-actions__button[data-message-action="reaction-message"]'); }
	get messagePin() { return browser.element('[data-id="pin-message"][data-type="message-action"]'); }
	// get messageClose() { return browser.element('[data-id="rc-popover-close"][data-type="message-action"]'); }

	// Emojis
	get emojiPickerMainScreen() { return browser.element('.emoji-picker'); }
	get emojiPickerPeopleIcon() { return browser.element('.emoji-picker .icon-people'); }
	get emojiPickerNatureIcon() { return browser.element('.emoji-picker .icon-nature'); }
	get emojiPickerFoodIcon() { return browser.element('.emoji-picker .icon-food'); }
	get emojiPickerActivityIcon() { return browser.element('.emoji-picker .icon-activity'); }
	get emojiPickerTravelIcon() { return browser.element('.emoji-picker .icon-travel'); }
	get emojiPickerObjectsIcon() { return browser.element('.emoji-picker .icon-objects'); }
	get emojiPickerSymbolsIcon() { return browser.element('.emoji-picker .icon-symbols'); }
	get emojiPickerFlagsIcon() { return browser.element('.emoji-picker .icon-flags'); }
	get emojiPickerModifierIcon() { return browser.element('.emoji-picker .icon-symbols'); }
	get emojiPickerChangeTone() { return browser.element('.emoji-picker .change-tone'); }
	get emojiPickerCustomIcon() { return browser.element('.emoji-picker .icon-rocket'); }
	get emojiPickerRecentIcon() { return browser.element('.emoji-picker .icon-recent'); }
	get emojiPickerFilter() { return browser.element('.emoji-picker .emoji-filter'); }
	get emojiPickerEmojiContainer() { return browser.element('.emoji-picker .emojis'); }
	get emojiGrinning() { return browser.element('.emoji-picker .emoji-grinning'); }
	get emojiSmile() { return browser.element('.emoji-picker .emoji-smile'); }

	// Popover
	get popoverWrapper() { return browser.element('.rc-popover'); }

	// Landing Page
	get GlobalAnnouncement() { return browser.element('#rocket-chat > div.rc-old.main-content.content-background-color > section > div > div'); }
	get GlobalAnnouncementBtn() { return browser.element('#rocket-chat > div.rc-old.main-content.content-background-color > section > div > div > button'); }

	// Sends a message and wait for the message to equal the text sent
	sendMessage(text) {
		this.setTextToInput(text);
		this.sendBtn.click();
		browser.waitUntil(function() {
			browser.waitForVisible('.message:last-child .body', 5000);
			return browser.getText('.message:last-child .body') === text;
		}, 5000);
	}

	// adds text to the input
	addTextToInput(text) {
		this.messageInput.waitForVisible(5000);
		this.messageInput.addValue(text);
	}

	// Clear and sets the text to the input
	setTextToInput(text) {
		this.messageInput.waitForVisible(5000);
		this.messageInput.setValue(text);
	}

	//uploads a file in the given filepath (url).
	fileUpload(filePath) {
		this.sendMessage('Prepare for the file');
		this.fileAttachment.chooseFile(filePath);
	}

	waitForLastMessageEqualsText(text) {
		browser.waitUntil(function() {
			browser.waitForVisible('.message:last-child .body', 5000);
			return browser.getText('.message:last-child .body') === text;
		}, 5000);
	}

	waitForLastMessageTextAttachmentEqualsText(text) {
		browser.waitUntil(function() {
			browser.waitForVisible('.message:last-child .attachment-text', 5000);
			return browser.getText('.message:last-child .attachment-text') === text;
		}, 5000);
	}

	// Wait for the last message author username to equal the provided text
	waitForLastMessageUserEqualsText(text) {
		browser.waitUntil(function() {
			browser.waitForVisible('.message:last-child .user-card-message:nth-of-type(2)', 5000);
			return browser.getText('.message:last-child .user-card-message:nth-of-type(2)') === text;
		}, 5000);
	}

	openMessageActionMenu() {
		this.lastMessage.moveToObject();
		this.messageOptionsBtn.waitForVisible(5000);
		this.messageOptionsBtn.click();
		this.messageActionMenu.waitForVisible(5000);
		browser.pause(100);
	}

	setLanguageToEnglish() {
		this.settingLanguageSelect.click();
		this.settingLanguageEnglish.click();
		this.settingSaveBtn.click();
	}

	tryToMentionAll() {
		this.addTextToInput('@all');
		this.sendBtn.click();
		this.waitForLastMessageEqualsText('Notify all in this room is not allowed');
	}

	// Do one of the message actions, based on the "action" parameter inserted.
	selectAction(action) {
		switch (action) {
			case 'edit':
				this.messageEdit.waitForVisible(5000);
				this.messageEdit.click();
				this.messageInput.addValue('this message was edited');
				break;
			case 'reply':
				this.messageReply.waitForVisible(5000);
				this.messageReply.click();
				this.messageInput.addValue(' this is a reply message');
				break;
			case 'delete':
				this.messageDelete.waitForVisible(5000);
				this.messageDelete.click();
				break;
			case 'permalink':
				this.messagePermalink.waitForVisible(5000);
				this.messagePermalink.click();
				break;
			case 'copy':
				this.messageCopy.waitForVisible(5000);
				this.messageCopy.click();
				break;
			case 'quote':
				this.messageQuote.waitForVisible(5000);
				this.messageQuote.click();
				this.messageInput.addValue(' this is a quote message');
				break;
			case 'star':
				this.messageStar.waitForVisible(5000);
				this.messageStar.click();
				break;
			case 'unread':
				this.messageUnread.waitForVisible(5000);
				this.messageUnread.click();
				break;
			case 'reaction':
				this.messageReply.waitForVisible(5000);
				this.messageReply.click();
				this.emojiPickerMainScreen.waitForVisible(5000);
				this.emojiPickerPeopleIcon.click();
				this.emojiGrinning.waitForVisible(5000);
				this.emojiGrinning.click();
				break;
			case 'close':
				this.messageClose.waitForVisible(5000);
				this.messageClose.click();
				break;
		}
	}
}

module.exports = new MainContent();
