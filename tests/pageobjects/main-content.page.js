import Page from './Page';

class MainContent extends Page {

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
	get popupFilePreview() { return browser.element('.upload-preview-file'); }
	get popupFileTitle() { return browser.element('.upload-preview-title'); }
	get popupFileCancelBtn() { return browser.element('.sa-button-container .cancel'); }
	get lastMessage() { return browser.element('.message:last-child .body'); }
	get lastMessageImg() { return browser.element('.message:last-child .attachment-image img'); }
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
	get messageClose() { return browser.element('.message:last-child .message-dropdown .message-dropdown-close'); }
	get emojiPickerMainScreen() { return browser.element('.emojiPicker'); }
	get emojiPickerPeopleIcon() { return browser.element('.emojiPicker .icon-people'); }
	get emojiGrinning() { return browser.element('.emojiPicker .emoji-grinning'); }


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
		browser.pause(1000);
	}

	openMessageActionMenu() {
		this.lastMessage.moveToObject();
		this.messageOptionsBtn.click();
	}

	//do one of the message actions, based on the "action" parameter inserted.
	selectAction(action) {
		switch (action) {
			case 'edit':
				this.messageEdit.waitForVisible(5000);
				this.messageEdit.click();
				browser.pause(1000);
				this.messageInput.addValue('this message was edited');
				break;
			case 'reply':
				this.messageReply.waitForVisible(5000);
				this.messageReply.click();
				browser.pause(1000);
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
				browser.pause(1000);
				this.messageInput.addValue(' this is a quote message');
				break;
			case 'star':
				this.messageStar.waitForVisible(5000);
				this.messageStar.click();
				break;
			case 'unread':
				this.messagePin.waitForVisible(5000);
				this.messagePin.click();
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