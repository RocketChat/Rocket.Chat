import Page from './Page';

class MainContent extends Page {

	get mainContent() { return browser.element('.main-content'); }
	get messageInput() { return browser.element('.input-message'); }
	get sendBtn() { return browser.element('.message-buttons.send-button'); }
	get emptyFavoriteStar() { return browser.element('.toggle-favorite .icon-star-empty'); }
	get favoriteStar() { return browser.element('.toggle-favorite .favorite-room'); }
	get fileAttachmentBtn() { return browser.element('.message-buttons .icon-attach'); }
	get fileAttachment() { return browser.element('.message-buttons input[type="file"]'); }
	get recordBtn() { return browser.element('.message-buttons .icon-mic'); }
	get videoCamBtn() { return browser.element('.message-buttons .icon-videocam'); }
	get emojiBtn() { return browser.element('.inner-left-toolbar .emoji-picker-icon'); }
	get channelTitle() { return browser.element('.room-title'); }
	get popupFileConfirmBtn() { return browser.element('.sa-confirm-button-container .confirm'); }
	get popupFileName() { return browser.element('#file-name'); }
	get popupFileDescription() { return browser.element('#file-description'); }
	get popupFileConfirmBtn() { return browser.element('.sa-confirm-button-container .confirm'); }
	get popupFilePreview() { return browser.element('.upload-preview-file'); }
	get popupFileTitle() { return browser.element('.upload-preview-title'); }
	get popupFileCancelBtn() { return browser.element('.sa-button-container .cancel'); }
	get lastMessageUser() { return browser.element('.message:last-child .user-card-message:nth-of-type(2)'); }
	get lastMessage() { return browser.element('.message:last-child .body'); }
	get lastMessageImg() { return browser.element('.message:last-child .body .inline-image'); }
	get lastMessageDesc() { return browser.element('.message:last-child .body .attachment-description'); }
	get lastMessageRoleAdded() { return browser.element('.message:last-child.subscription-role-added .body'); }
	get beforeLastMessage() { return browser.element('.message:nth-last-child(2) .body'); }
	get lastMessageUserTag() { return browser.element('.message:last-child .role-tag'); }
	get lastMessageImg() { return browser.element('.message:last-child .attachment-image img'); }
	get lastMessageTextAttachment() { return browser.element('.message:last-child .attachment-text'); }
	get messageOptionsBtn() { return browser.element('.message:last-child .info .message-cog-container .icon-cog'); }
	get messageReply() { return browser.element('.message:last-child .message-dropdown .reply-message'); }
	get messageActionMenu() { return browser.element('.message:last-child .message-dropdown'); }
	get messageEdit() { return browser.element('.message:last-child .message-dropdown .edit-message'); }
	get messageDelete() { return browser.element('.message:last-child .message-dropdown .delete-message'); }
	get messagePermalink() { return browser.element('.message:last-child .message-dropdown .permalink'); }
	get messageCopy() { return browser.element('.message:last-child .message-dropdown .copy'); }
	get messageQuote() { return browser.element('.message:last-child .message-dropdown .quote-message'); }
	get messageStar() { return browser.element('.message:last-child .message-dropdown .star-message'); }
	get messageUnread() { return browser.element('.message:last-child .message-dropdown .mark-message-as-unread'); }
	get messageReaction() { return browser.element('.message:last-child .message-dropdown .reaction-message'); }
	get messagePin() { return browser.element('.message:last-child .message-dropdown .pin-message'); }
	get messageClose() { return browser.element('.message:last-child .message-dropdown .message-dropdown-close'); }
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
	get messagePopUp() { return browser.element('.message-popup'); }
	get messagePopUpTitle() { return browser.element('.message-popup-title'); }
	get messagePopUpItems() { return browser.element('.message-popup-items'); }
	get messagePopUpFirstItem() { return browser.element('.popup-item.selected'); }
	get mentionAllPopUp() { return browser.element('.popup-item[data-id="all"]'); }
	get joinChannelBtn() { return browser.element('.button.join'); }

	sendMessage(text) {
		this.setTextToInput(text);
		this.sendBtn.click();
		browser.waitUntil(function() {
			return browser.getText('.message:last-child .body') === text;
		}, 2000);
	}

	addTextToInput(text) {
		this.messageInput.waitForVisible(5000);
		this.messageInput.addValue(text);
	}

	setTextToInput(text) {
		this.messageInput.waitForVisible(5000);
		this.messageInput.setValue(text);
	}

	//uploads a file in the given filepath (url).
	fileUpload(filePath) {
		this.sendMessage('Prepare for the file');
		this.fileAttachment.chooseFile(filePath);
	}

	openMessageActionMenu() {
		this.lastMessage.moveToObject();
		this.messageOptionsBtn.waitForVisible(5000);
		this.messageOptionsBtn.click();
		this.messageActionMenu.waitForVisible(5000);
	}

	setLanguageToEnglish() {
		this.settingLanguageSelect.click();
		this.settingLanguageEnglish.click();
		this.settingSaveBtn.click();
	}

	waitForLastMessageTextAttachmentEqualsText(text) {
		browser.waitUntil(function() {
			return browser.getText('.message:last-child .attachment-text') === text;
		}, 2000);
	}

	waitForLastMessageEqualsText(text) {
		browser.waitUntil(function() {
			return browser.getText('.message:last-child .body') === text;
		}, 2000);
	}

	waitForLastMessageUserEqualsText(text) {
		browser.waitUntil(function() {
			return browser.getText('.message:last-child .user-card-message:nth-of-type(2)') === text;
		}, 2000);
	}

	tryToMentionAll() {
		this.addTextToInput('@all');
		this.sendBtn.click();
		this.waitForLastMessageEqualsText('Notify all in this room is not allowed');
		this.lastMessage.getText().should.equal('Notify all in this room is not allowed');
	}

	//do one of the message actions, based on the "action" parameter inserted.
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
