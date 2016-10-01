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

	sendMessage(text) {
		this.messageInput.setValue(text);
		this.sendBtn.click();
		browser.waitUntil(function() {
			return browser.getText('.message:last-child .body') === text;
		}, 2000);
	}

	addTextToInput(text) {
		this.messageInput.waitForVisible(5000);
		this.messageInput.setValue(text);
	}

	fileUpload(filePath) {
		this.sendMessage('Prepare for the file');
		this.fileAttachment.chooseFile(filePath);
		browser.pause(1000);
	}
}

module.exports = new MainContent();