import Page from './Page';
import flexTab from './flex-tab.page';

class MainContent extends Page {
	get mainContent() {
		return browser.element('.main-content');
	}

	// Main Content Header (Channel Title Area)
	get emptyFavoriteStar() {
		return browser.element('.rcx-room-header .rcx-icon--name-star');
	}

	get favoriteStar() {
		return browser.element('.rcx-room-header .rcx-icon--name-star-filled');
	}

	get channelTitle() {
		return browser.element('.rcx-room-header');
	}

	// Main Content Footer (Message Input Area)
	get messageInput() {
		return browser.element('.js-input-message');
	}

	get sendBtn() {
		return browser.element('.rc-message-box__icon.js-send');
	}

	get messageBoxActions() {
		return browser.element('.rc-message-box__icon');
	}

	get recordBtn() {
		return browser.element('.js-audio-message-record');
	}

	get emojiBtn() {
		return browser.element('.rc-message-box__icon.emoji-picker-icon');
	}

	get messagePopUp() {
		return browser.element('.message-popup');
	}

	get messagePopUpTitle() {
		return browser.element('.message-popup-title');
	}

	get messagePopUpItems() {
		return browser.element('.message-popup-items');
	}

	get messagePopUpFirstItem() {
		return browser.element('.popup-item.selected');
	}

	get mentionAllPopUp() {
		return browser.element('.popup-item[data-id="all"]');
	}

	get joinChannelBtn() {
		return browser.element('.button.join');
	}

	// Messages
	get lastMessageUser() {
		return browser.element('.message:last-child .title .user-card-message');
	}

	get lastMessage() {
		return browser.element('.message:last-child');
	}

	get lastMessageDesc() {
		return browser.element('.message:last-child .body .attachment-description');
	}

	get lastMessageRoleAdded() {
		return browser.element('.message:last-child.subscription-role-added .body');
	}

	get beforeLastMessage() {
		return browser.element('.message:nth-last-child(2) .body');
	}

	get lastMessageUserTag() {
		return browser.element('.message:last-child .role-tag');
	}

	get lastMessageImg() {
		return browser.element('.message:last-child .attachment-image img');
	}

	get lastMessageTextAttachment() {
		return browser.element('.message:last-child .attachment-text');
	}

	get beforeLastMessageQuote() {
		return browser.element('.message:nth-last-child(2)');
	}

	get lastMessageQuote() {
		return browser.element('.message:last-child');
	}

	get messageOptionsBtn() {
		return browser.element('.message:last-child .message-actions__menu');
	}

	get messageOptionsBtns() {
		return browser.element('.message:last-child .message-actions');
	}

	get messageActionMenu() {
		return browser.element('.rc-popover .rc-popover__content');
	}

	get messageReply() {
		return browser.element('.message:last-child .message-actions__button[data-message-action="reply-in-thread"]');
	}

	get messageEdit() {
		return browser.element('[data-id="edit-message"][data-type="message-action"]');
	}

	get messageDelete() {
		return browser.element('[data-id="delete-message"][data-type="message-action"]');
	}

	get messagePermalink() {
		return browser.element('[data-id="permalink"][data-type="message-action"]');
	}

	get messageCopy() {
		return browser.element('[data-id="copy"][data-type="message-action"]');
	}

	get messageQuote() {
		return browser.element('[data-id="quote-message"][data-type="message-action"]');
	}

	get messageStar() {
		return browser.element('[data-id="star-message"][data-type="message-action"]');
	}

	get messageUnread() {
		return browser.element('[data-id="mark-message-as-unread"][data-type="message-action"]');
	}

	get messageReplyInDM() {
		return browser.element('[data-id="reply-directly"][data-type="message-action"]');
	}

	// get messageReaction() { return browser.element('.message-actions__button[data-message-action="reaction-message"]'); }
	get messagePin() {
		return browser.element('[data-id="pin-message"][data-type="message-action"]');
	}
	// get messageClose() { return browser.element('[data-id="rc-popover-close"][data-type="message-action"]'); }

	// Emojis
	get emojiPickerMainScreen() {
		return browser.element('.emoji-picker');
	}

	get emojiPickerPeopleIcon() {
		return browser.element('.emoji-picker .icon-people');
	}

	get emojiPickerNatureIcon() {
		return browser.element('.emoji-picker .icon-nature');
	}

	get emojiPickerFoodIcon() {
		return browser.element('.emoji-picker .icon-food');
	}

	get emojiPickerActivityIcon() {
		return browser.element('.emoji-picker .icon-activity');
	}

	get emojiPickerTravelIcon() {
		return browser.element('.emoji-picker .icon-travel');
	}

	get emojiPickerObjectsIcon() {
		return browser.element('.emoji-picker .icon-objects');
	}

	get emojiPickerSymbolsIcon() {
		return browser.element('.emoji-picker .icon-symbols');
	}

	get emojiPickerFlagsIcon() {
		return browser.element('.emoji-picker .icon-flags');
	}

	get emojiPickerModifierIcon() {
		return browser.element('.emoji-picker .icon-symbols');
	}

	get emojiPickerChangeTone() {
		return browser.element('.emoji-picker .change-tone');
	}

	get emojiPickerCustomIcon() {
		return browser.element('.emoji-picker .icon-rocket');
	}

	get emojiPickerRecentIcon() {
		return browser.element('.emoji-picker .icon-recent');
	}

	get emojiPickerFilter() {
		return browser.element('.emoji-picker .js-emojipicker-search');
	}

	get emojiPickerEmojiContainer() {
		return browser.element('.emoji-picker .emojis');
	}

	get emojiGrinning() {
		return browser.element('.emoji-picker .emoji-grinning');
	}

	get emojiSmile() {
		return browser.element('.emoji-picker .emoji-smile');
	}

	// Popover
	get popoverWrapper() {
		return browser.element('.rc-popover');
	}

	// Sends a message and wait for the message to equal the text sent
	sendMessage(text) {
		this.setTextToInput(text);
		this.sendBtn.click();
		cy.get('.message:last-child .body').should('be.visible');
		cy.get('.message:last-child .body').should('contain', text);
	}

	// adds text to the input
	addTextToInput(text) {
		this.messageInput.type(text);
	}

	// Clear and sets the text to the input
	setTextToInput(text) {
		cy.wait(200);
		this.messageInput.clear(text);
		if (text) {
			this.messageInput.type(text);
		}
	}

	// uploads a file in the given filepath (url).
	fileUpload(filePath) {
		this.sendMessage('Prepare for the file');
		this.fileAttachment.chooseFile(filePath);
	}

	waitForLastMessageEqualsText(text) {
		cy.get('.message:last-child .body').should('contain', text);
	}

	waitForLastMessageQuoteEqualsText(text) {
		cy.get('.message:last-child .rcx-attachment__details').should('contain', text);
	}

	waitForLastMessageEqualsHtml(text) {
		cy.get('.message:last-child .body').should('contain.html', text);
	}

	waitForLastMessageTextAttachmentEqualsText(text) {
		return cy.get('.message:last-child .rcx-attachment__details .rcx-box--with-inline-elements').should('contain', text);
	}

	// Wait for the last message author username to equal the provided text
	waitForLastMessageUserEqualsText(text) {
		browser.waitUntil(function () {
			browser.waitForVisible('.message:last-child .user-card-message:nth-of-type(2)', 5000);
			return browser.getText('.message:last-child .user-card-message:nth-of-type(2)') === text;
		}, 5000);
	}

	openMessageActionMenu() {
		this.lastMessage.scrollIntoView().should('be.visible').should('not.have.class', 'temp');
		this.messageOptionsBtns.invoke('show');
		this.messageOptionsBtn.click();
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
				this.messageEdit.click().wait(100);
				this.messageInput.type('this message was edited');
				break;
			case 'reply':
				this.messageReply.click().wait(100);
				flexTab.messageInput.type('this is a reply message');
				break;
			case 'delete':
				this.messageDelete.click();
				break;
			case 'permalink':
				this.messagePermalink.click();
				break;
			case 'copy':
				this.messageCopy.click();
				break;
			case 'quote':
				this.messageQuote.click().wait(100);
				this.messageInput.type('this is a quote message');
				break;
			case 'star':
				this.messageStar.click();
				break;
			case 'unread':
				this.messageUnread.click();
				break;
			case 'reaction':
				this.messageReply.click();
				this.emojiPickerPeopleIcon.click();
				this.emojiGrinning.click();
				break;
			case 'close':
				this.messageClose.click();
				break;
		}
	}
}

export default new MainContent();
