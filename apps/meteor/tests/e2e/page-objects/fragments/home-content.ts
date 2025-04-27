import fs from 'fs/promises';

import type { Locator, Page } from '@playwright/test';

import { expect } from '../../utils/test';

export class HomeContent {
	protected readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	get channelHeader(): Locator {
		return this.page.locator('main header');
	}

	get channelRetentionPolicyWarning(): Locator {
		return this.page.locator('main').getByRole('alert', { name: 'Retention policy warning banner' });
	}

	get inputMessage(): Locator {
		return this.page.locator('[name="msg"]');
	}

	get inputThreadMessage(): Locator {
		return this.page.getByRole('dialog').locator('[name="msg"]').last();
	}

	get messagePopupUsers(): Locator {
		return this.page.locator('role=menu[name="People"]');
	}

	get lastUserMessage(): Locator {
		return this.page.locator('[data-qa-type="message"]').last();
	}

	nthMessage(index: number): Locator {
		return this.page.locator('[data-qa-type="message"]').nth(index);
	}

	get lastUserMessageNotThread(): Locator {
		return this.page.locator('div.messages-box [data-qa-type="message"]').last();
	}

	get lastUserMessageBody(): Locator {
		return this.lastUserMessage.locator('[data-qa-type="message-body"]');
	}

	get lastUserMessageNotSequential(): Locator {
		return this.page.locator('[data-qa-type="message"][data-sequential="false"]').last();
	}

	get encryptedRoomHeaderIcon(): Locator {
		return this.page.locator('.rcx-room-header i.rcx-icon--name-key');
	}

	get lastIgnoredUserMessage(): Locator {
		return this.lastUserMessageBody.locator('role=button[name="This message was ignored"]');
	}

	get btnJoinRoom(): Locator {
		return this.page.locator('role=button[name="Join"]');
	}

	async openRoomInfo(): Promise<void> {
		await this.channelHeader.locator('button[data-qa-id="ToolBoxAction-info-circled"]').click();
	}

	async joinRoom(): Promise<void> {
		await this.btnJoinRoom.click();
	}

	async joinRoomIfNeeded(): Promise<void> {
		if (await this.inputMessage.isEnabled()) {
			return;
		}
		if (!(await this.btnJoinRoom.isVisible())) {
			return;
		}
		await this.joinRoom();
	}

	async sendMessage(text: string): Promise<void> {
		await this.joinRoomIfNeeded();
		await this.page.waitForSelector('[name="msg"]:not([disabled])');
		await this.page.locator('[name="msg"]').fill(text);
		await this.page.getByRole('button', { name: 'Send', exact: true }).click();
	}

	async dispatchSlashCommand(text: string): Promise<void> {
		await this.joinRoomIfNeeded();
		await this.page.waitForSelector('[name="msg"]:not([disabled])');
		await this.page.locator('[name="msg"]').fill('');
		await this.page.locator('[name="msg"]').fill(text);
		await this.page.keyboard.press('Enter');
		await this.page.keyboard.press('Enter');
	}

	async forwardMessage(chatName: string) {
		await this.page.locator('[data-qa-type="message"]').last().hover();
		await this.page.locator('role=button[name="Forward message"]').click();

		await this.page.getByRole('textbox', { name: 'Person or Channel', exact: true }).click();
		await this.page.keyboard.type(chatName);
		await this.page.locator('#position-container').getByText(chatName).waitFor();
		await this.page.locator('#position-container').getByText(chatName).click();
		await this.page.locator('role=button[name="Forward"]').click();
	}

	get btnModalCancel(): Locator {
		return this.page.locator('#modal-root .rcx-button-group--align-end .rcx-button--secondary');
	}

	get fileUploadModal(): Locator {
		return this.page.getByRole('dialog', { name: 'File Upload' });
	}

	get createDiscussionModal(): Locator {
		return this.page.getByRole('dialog', { name: 'Create discussion' });
	}

	get inputDiscussionName(): Locator {
		return this.createDiscussionModal.getByRole('textbox', { name: 'Name' });
	}

	get btnCreateDiscussionModal(): Locator {
		return this.createDiscussionModal.getByRole('button', { name: 'Create' });
	}

	get modalFilePreview(): Locator {
		return this.page.locator(
			'//div[@id="modal-root"]//header//following-sibling::div[1]//div//div//img | //div[@id="modal-root"]//header//following-sibling::div[1]//div//div//div//i',
		);
	}

	get btnModalConfirm(): Locator {
		return this.page.locator('#modal-root .rcx-button-group--align-end .rcx-button--primary');
	}

	get descriptionInput(): Locator {
		return this.page.locator('//div[@id="modal-root"]//fieldset//div[2]//span//input');
	}

	get getFileDescription(): Locator {
		return this.page.locator('[data-qa-type="message"]:last-child [data-qa-type="message-body"]');
	}

	get fileNameInput(): Locator {
		return this.page.locator('//div[@id="modal-root"]//fieldset//div[1]//span//input');
	}

	get lastMessageFileName(): Locator {
		return this.page.locator('[data-qa-type="message"]:last-child [data-qa-type="attachment-title-link"]');
	}

	get lastMessageTextAttachmentEqualsText(): Locator {
		return this.page.locator('[data-qa-type="message"]:last-child .rcx-attachment__details .rcx-message-body');
	}

	get lastThreadMessageTextAttachmentEqualsText(): Locator {
		return this.page.locator('div.thread-list ul.thread [data-qa-type="message"]').last().locator('.rcx-attachment__details');
	}

	get mainThreadMessageText(): Locator {
		return this.page.locator('div.thread-list ul.thread [data-qa-type="message"]').first();
	}

	get lastThreadMessageText(): Locator {
		return this.page.locator('div.thread-list ul.thread [data-qa-type="message"]').last();
	}

	get lastThreadMessagePreviewText(): Locator {
		return this.page.locator('div.messages-box ul.messages-list [role=link]').last();
	}

	get lastThreadMessageFileDescription(): Locator {
		return this.page.locator('div.thread-list ul.thread [data-qa-type="message"]').last().locator('[data-qa-type="message-body"]');
	}

	get lastThreadMessageFileName(): Locator {
		return this.page.locator('div.thread-list ul.thread [data-qa-type="message"]').last().locator('[data-qa-type="attachment-title-link"]');
	}

	get btnOptionEditMessage(): Locator {
		return this.page.locator('[data-qa-id="edit-message"]');
	}

	get btnOptionDeleteMessage(): Locator {
		return this.page.locator('[data-qa-id="delete-message"]');
	}

	get btnOptionPinMessage(): Locator {
		return this.page.locator('[data-qa-id="pin-message"]');
	}

	get btnOptionStarMessage(): Locator {
		return this.page.locator('[data-qa-id="star-message"]');
	}

	get btnOptionFileUpload(): Locator {
		return this.page.locator('[data-qa-id="file-upload"]');
	}

	get btnVideoMessage(): Locator {
		return this.page.locator('[data-qa-id="video-message"]');
	}

	get btnRecordAudio(): Locator {
		return this.page.locator('[data-qa-id="audio-message"]');
	}

	get btnMenuMoreActions() {
		return this.page.getByRole('button', { name: 'More actions', exact: true });
	}

	get userCard(): Locator {
		return this.page.locator('[data-qa="UserCard"]');
	}

	get linkUserCard(): Locator {
		return this.userCard.locator('a');
	}

	get btnContactInformation(): Locator {
		return this.page.locator('[data-qa-id="ToolBoxAction-user"]');
	}

	get btnContactEdit(): Locator {
		return this.page.getByRole('dialog').getByRole('button', { name: 'Edit', exact: true });
	}

	get inputModalClosingComment(): Locator {
		return this.page.locator('#modal-root input:nth-child(1)[name="comment"]');
	}

	get btnSendTranscript(): Locator {
		return this.page.locator('role=button[name="Send transcript"]');
	}

	get btnSendTranscriptToEmail(): Locator {
		return this.page.locator('li.rcx-option', { hasText: 'Send via email' });
	}

	get btnSendTranscriptAsPDF(): Locator {
		return this.page.locator('li.rcx-option', { hasText: 'Export as PDF' });
	}

	get btnCannedResponses(): Locator {
		return this.page.locator('[data-qa-id="ToolBoxAction-canned-response"]');
	}

	get btnNewCannedResponse(): Locator {
		return this.page.locator('.rcx-vertical-bar button:has-text("Create")');
	}

	get imageGallery(): Locator {
		return this.page.getByRole('dialog', { name: 'Image gallery', exact: true });
	}

	get imageGalleryImage(): Locator {
		return this.imageGallery.locator('.swiper-zoom-container img');
	}

	async getGalleryButtonByName(name: string) {
		return this.imageGallery.locator(`button[name="${name}"]`);
	}

	get btnComposerEmoji(): Locator {
		return this.page.locator('role=toolbar[name="Composer Primary Actions"] >> role=button[name="Emoji"]');
	}

	get dialogEmojiPicker(): Locator {
		return this.page.getByRole('dialog', { name: 'Emoji picker' });
	}

	get scrollerEmojiPicker(): Locator {
		return this.dialogEmojiPicker.locator('[data-overlayscrollbars]');
	}

	getEmojiPickerTabByName(name: string) {
		return this.dialogEmojiPicker.locator(`role=tablist >> role=tab[name="${name}"]`);
	}

	getEmojiByName(name: string) {
		return this.dialogEmojiPicker.locator(`role=tabpanel >> role=button[name="${name}"]`);
	}

	async pickEmoji(emoji: string, section = 'Smileys & People') {
		await this.btnComposerEmoji.click();
		await this.getEmojiPickerTabByName(section).click();
		await this.getEmojiByName(emoji).click();
	}

	async dragAndDropTxtFile(): Promise<void> {
		const contract = await fs.readFile('./tests/e2e/fixtures/files/any_file.txt', 'utf-8');
		const dataTransfer = await this.page.evaluateHandle((contract) => {
			const data = new DataTransfer();
			const file = new File([`${contract}`], 'any_file.txt', {
				type: 'text/plain',
			});
			data.items.add(file);
			return data;
		}, contract);

		await this.inputMessage.dispatchEvent('dragenter', { dataTransfer });

		await this.page.locator('[role=dialog][data-qa="DropTargetOverlay"]').dispatchEvent('drop', { dataTransfer });
	}

	async dragAndDropLstFile(): Promise<void> {
		const contract = await fs.readFile('./tests/e2e/fixtures/files/lst-test.lst', 'utf-8');
		const dataTransfer = await this.page.evaluateHandle((contract) => {
			const data = new DataTransfer();
			const file = new File([`${contract}`], 'lst-test.lst', {
				type: 'text/plain',
			});
			data.items.add(file);
			return data;
		}, contract);

		await this.inputMessage.dispatchEvent('dragenter', { dataTransfer });

		await this.page.locator('[role=dialog][data-qa="DropTargetOverlay"]').dispatchEvent('drop', { dataTransfer });
	}

	async dragAndDropTxtFileToThread(): Promise<void> {
		const contract = await fs.readFile('./tests/e2e/fixtures/files/any_file.txt', 'utf-8');
		const dataTransfer = await this.page.evaluateHandle((contract) => {
			const data = new DataTransfer();
			const file = new File([`${contract}`], 'any_file.txt', {
				type: 'text/plain',
			});
			data.items.add(file);
			return data;
		}, contract);

		await this.inputThreadMessage.dispatchEvent('dragenter', { dataTransfer });

		await this.page.locator('[role=dialog][data-qa="DropTargetOverlay"]').dispatchEvent('drop', { dataTransfer });
	}

	async sendFileMessage(fileName: string): Promise<void> {
		await this.page.locator('input[type=file]').setInputFiles(`./tests/e2e/fixtures/files/${fileName}`);
	}

	async openLastMessageMenu(): Promise<void> {
		await this.page.locator('[data-qa-type="message"]').last().hover();
		await this.page.locator('[data-qa-type="message"]').last().locator('role=button[name="More"]').waitFor();
		await this.page.locator('[data-qa-type="message"]').last().locator('role=button[name="More"]').click();
	}

	async openLastThreadMessageMenu(): Promise<void> {
		await this.page.getByRole('dialog').locator('[data-qa-type="message"]').last().hover();
		await this.page.getByRole('dialog').locator('[data-qa-type="message"]').last().locator('role=button[name="More"]').waitFor();
		await this.page.getByRole('dialog').locator('[data-qa-type="message"]').last().locator('role=button[name="More"]').click();
	}

	async toggleAlsoSendThreadToChannel(isChecked: boolean): Promise<void> {
		await this.page
			.getByRole('dialog')
			.locator('label', { has: this.page.getByRole('checkbox', { name: 'Also send to channel' }) })
			.setChecked(isChecked);
	}

	get lastSystemMessageBody(): Locator {
		return this.page.locator('[data-qa-type="system-message-body"]').last();
	}

	get resumeOnHoldOmnichannelChatButton(): Locator {
		return this.page.locator('button.rcx-button--primary >> text="Resume"');
	}

	get btnOnHold(): Locator {
		return this.page.locator('[data-qa-id="ToolBoxAction-pause-unfilled"]');
	}

	get btnVideoCall(): Locator {
		return this.page.locator('[role=toolbar][aria-label="Primary Room actions"]').getByRole('button', { name: 'Video call' });
	}

	get btnStartVideoCall(): Locator {
		return this.page.locator('#video-conf-root .rcx-button--primary.rcx-button >> text="Start call"');
	}

	getVideoConfPopupByName(name: string): Locator {
		return this.page.getByRole('dialog', { name });
	}

	get btnDeclineVideoCall(): Locator {
		return this.page.locator('.rcx-button--secondary-danger.rcx-button >> text="Decline"');
	}

	get videoConfMessageBlock(): Locator {
		return this.page.locator('.rcx-videoconf-message-block');
	}

	get videoConfMessageBlockAvatars(): Locator {
		return this.videoConfMessageBlock.getByLabel('figure');
	}

	get btnAnonymousSignIn(): Locator {
		return this.page.locator('footer >> role=button[name="Sign in to start talking"]');
	}

	get btnAnonymousTalk(): Locator {
		return this.page.locator('role=button[name="Or talk as anonymous"]');
	}

	get nextSlideButton(): Locator {
		return this.page.getByLabel('Next slide');
	}

	get previousSlideButton(): Locator {
		return this.page.getByLabel('Previous slide');
	}

	get currentGalleryImage(): Locator {
		return this.page.locator('div[class="swiper-slide swiper-slide-active"] img');
	}

	// TODO: use getSystemMessageByText instead
	findSystemMessage(text: string): Locator {
		return this.page.locator(`[data-qa-type="system-message-body"] >> text="${text}"`);
	}

	getSystemMessageByText(text: string): Locator {
		return this.page.locator('[role="listitem"][aria-roledescription="system message"]', { hasText: text });
	}

	getMessageByText(text: string): Locator {
		return this.page.locator('[role="listitem"][aria-roledescription="message"]', { hasText: text });
	}

	async waitForChannel(): Promise<void> {
		await this.page.locator('role=main').waitFor();
		await this.page.locator('role=main >> role=heading[level=1]').waitFor();
		const messageList = this.page.getByRole('main').getByRole('list', { name: 'Message list', exact: true });
		await messageList.waitFor();

		await expect(messageList).not.toHaveAttribute('aria-busy', 'true');
	}

	async openReplyInThread(): Promise<void> {
		await this.page.locator('[data-qa-type="message"]').last().hover();
		await this.page.locator('[data-qa-type="message"]').last().locator('role=button[name="Reply in thread"]').waitFor();
		await this.page.locator('[data-qa-type="message"]').last().locator('role=button[name="Reply in thread"]').click();
	}

	async sendMessageInThread(text: string): Promise<void> {
		await this.page.getByRole('dialog').getByRole('textbox', { name: 'Message' }).fill(text);
		await this.page.getByRole('dialog').getByRole('button', { name: 'Send', exact: true }).click();
	}

	get btnClearSelection() {
		return this.page.getByRole('button', { name: 'Clear selection' });
	}

	get btnJoinChannel() {
		return this.page.getByRole('button', { name: 'Join channel' });
	}

	get contactUnknownCallout() {
		return this.page.getByRole('status', { name: 'Unknown contact. This contact is not on the contact list.' });
	}

	get btnDismissContactUnknownCallout() {
		return this.contactUnknownCallout.getByRole('button', { name: 'Dismiss' });
	}
}
