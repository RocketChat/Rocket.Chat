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
		return browser.element('[data-qa-type="message"]:last-child [data-username]');
	}

	get lastMessage() {
		return browser.element('[data-qa-type="message"]:last-child');
	}

	get lastMessageDesc() {
		return browser.element('[data-qa-type="message"]:last-child .body .attachment-description');
	}

	get lastMessageRoleAdded() {
		return browser.element('[data-qa-type="message"]:last-child.subscription-role-added .body');
	}

	get beforeLastMessage() {
		return browser.element('[data-qa-type="message"]:nth-last-child(2) [data-qa-type="message-body"]');
	}

	get lastMessageUserTag() {
		return browser.element('[data-qa-type="message"]:last-child .role-tag');
	}

	get lastMessageImg() {
		return browser.element('[data-qa-type="message"]:last-child .attachment-image img');
	}

	get lastMessageTextAttachment() {
		return browser.element('[data-qa-type="message"]:last-child .attachment-text');
	}

	get beforeLastMessageQuote() {
		return browser.element('[data-qa-type="message"]:nth-last-child(2)');
	}

	get lastMessageQuote() {
		return browser.element('[data-qa-type="message"]:last-child');
	}

	get messageOptionsBtn() {
		return browser.element('[data-qa-type="message"]:last-child [data-qa-type="message-action-menu"][data-qa-id="menu"]');
	}

	get messageOptionsBtns() {
		return browser.element('[data-qa-type="message"]:last-child [data-qa-type="message-action-menu"]');
	}

	get messageActionMenu() {
		return browser.element('[data-qa-type="message-action-menu-options"]');
	}

	get messageActionMenuBtns() {
		return browser.element('[data-qa-type="message-action-menu-options"] [data-qa-type="message-action"]');
	}

	get messageReply() {
		return browser.element('[data-qa-type="message-action"][data-qa-id="reply-in-thread"]');
	}

	get messageEdit() {
		return browser.element('[data-qa-id="edit-message"][data-qa-type="message-action"]');
	}

	get messageDelete() {
		return browser.element('[data-qa-id="delete-message"][data-qa-type="message-action"]');
	}

	get messagePermalink() {
		return browser.element('[data-qa-id="permalink"][data-qa-type="message-action"]');
	}

	get messageCopy() {
		return browser.element('[data-qa-id="copy"][data-qa-type="message-action"]');
	}

	get messageQuote() {
		return browser.element('[data-qa-id="quote-message"][data-qa-type="message-action"]');
	}

	get messageStar() {
		return browser.element('[data-qa-id="star-message"][data-qa-type="message-action"]');
	}

	get messageUnread() {
		return browser.element('[data-qa-id="mark-message-as-unread"][data-qa-type="message-action"]');
	}

	get messageReplyInDM() {
		return browser.element('[data-qa-id="reply-directly"][data-qa-type="message-action"]');
	}

	get messagePin() {
		return browser.element('[data-qa-id="pin-message"][data-qa-type="message-action"]');
	}

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
		cy.wait(300);
		this.lastMessage.should('be.visible');
		cy.get('[data-qa-type="message"]:last-child [data-qa-type="message-body"]').should('contain', text);
	}

	// adds text to the input
	addTextToInput(text) {
		this.messageInput.type(text);
	}

	// Clear and sets the text to the input
	setTextToInput(text) {
		cy.wait(400);
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
		cy.get('[data-qa-type="message"]:last-child [data-qa-type="message-body"]').should('contain', text);
	}

	waitForLastMessageQuoteEqualsText(text) {
		cy.get('[data-qa-type="message"]:last-child .rcx-attachment__details').should('contain', text);
	}

	waitForLastMessageEqualsHtml(text) {
		cy.wait(200);
		cy.get('[data-qa-type="message"]:last-child [data-qa-type="message-body"]').should('contain.html', text);
	}

	waitForLastMessageTextAttachmentEqualsText(text) {
		return cy.get('[data-qa-type="message"]:last-child .rcx-attachment__details .rcx-box--with-inline-elements').should('contain', text);
	}

	openMessageActionMenu() {
		this.lastMessage.realHover().should('be.visible');

		cy.waitUntil(() => {
			return this.messageOptionsBtns.then((el) => el.length);
		});

		this.messageOptionsBtns.should('be.visible');

		this.messageOptionsBtn.click().wait(100);

		cy.waitUntil(() => {
			return this.messageActionMenuBtns.then((el) => el.length);
		});

		this.messageActionMenuBtns.should('be.visible');
	}

	closeMessageActionMenu() {
		// Old popover closes only on click outside
		cy.get('body').realHover({ position: 'topLeft' }).click();
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
