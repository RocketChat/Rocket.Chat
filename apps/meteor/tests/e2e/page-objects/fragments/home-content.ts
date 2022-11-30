import fs from 'fs/promises';

import type { Locator, Page } from '@playwright/test';

export class HomeContent {
	protected readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	get inputMessage(): Locator {
		return this.page.locator('[name="msg"]');
	}

	get messagePopUpItems(): Locator {
		return this.page.locator('.message-popup-items');
	}

	get lastUserMessage(): Locator {
		return this.page.locator('[data-qa-type="message"]').last();
	}

	get lastUserMessageNotSequential(): Locator {
		return this.page.locator('[data-qa-type="message"][data-sequential="false"]').last();
	}

	async sendMessage(text: string): Promise<void> {
		await this.page.locator('[name="msg"]').type(text);
		await this.page.keyboard.press('Enter');
	}

	async dispatchSlashCommand(text: string): Promise<void> {
		await this.page.locator('[name="msg"]').type(text);
		await this.page.keyboard.press('Enter');
		await this.page.keyboard.press('Enter');
	}

	get btnModalCancel(): Locator {
		return this.page.locator('#modal-root .rcx-button-group--align-end .rcx-button--secondary');
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
		return this.page.locator('[data-qa-type="message"]:last-child [data-qa-type="attachment-description"]');
	}

	get fileNameInput(): Locator {
		return this.page.locator('//div[@id="modal-root"]//fieldset//div[1]//span//input');
	}

	get lastMessageFileName(): Locator {
		return this.page.locator('[data-qa-type="message"]:last-child [data-qa-type="attachment-title-link"]');
	}

	get waitForLastMessageTextAttachmentEqualsText(): Locator {
		return this.page.locator('[data-qa-type="message"]:last-child .rcx-attachment__details .rcx-message-body');
	}

	get waitForLastThreadMessageTextAttachmentEqualsText(): Locator {
		return this.page.locator('//main//aside >> [data-qa-type="message"]:last-child .rcx-attachment__details');
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
		return this.page.locator('.rc-popover__content [data-id="video-message"]');
	}

	get btnRecordAudio(): Locator {
		return this.page.locator('[data-qa-id="audio-record"]');
	}

	get btnMenuMoreActions() {
		return this.page.locator('[data-qa-id="menu-more-actions"]');
	}

	get linkUserCard(): Locator {
		return this.page.locator('[data-qa="UserCard"] a');
	}

	get btnContactInformation(): Locator {
		return this.page.locator('[data-qa-id="ToolBoxAction-user"]');
	}

	get btnContactEdit(): Locator {
		return this.page.locator('.rcx-vertical-bar button:has-text("Edit")');
	}

	get inputModalClosingComment(): Locator {
		return this.page.locator('#modal-root input:nth-child(1)[name="comment"]');
	}

	get btnSendTranscript(): Locator {
		return this.page.locator('[data-qa-id="ToolBoxAction-mail-arrow-top-right"]');
	}

	get btnCannedResponses(): Locator {
		return this.page.locator('[data-qa-id="ToolBoxAction-canned-response"]');
	}

	get btnNewCannedResponse(): Locator {
		return this.page.locator('.rcx-vertical-bar button:has-text("Create")');
	}

	get inputModalAgentUserName(): Locator {
		return this.page.locator('#modal-root input:nth-child(1)');
	}

	get inputModalAgentForwardComment(): Locator {
		return this.page.locator('[data-qa-id="ForwardChatModalTextAreaInputComment"]');
	}

	async pickEmoji(emoji: string, section = 'icon-people') {
		await this.page.locator('.rc-message-box__icon.emoji-picker-icon').click();
		await this.page.locator(`//*[contains(@class, "emoji-picker")]//*[contains(@class, "${section}")]`).click();
		await this.page.locator(`//*[contains(@class, "emoji-picker")]//*[contains(@class, "${emoji}")]`).first().click();
	}

	async dragAndDropFile(): Promise<void> {
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

	async openLastMessageMenu(): Promise<void> {
		await this.page.locator('[data-qa-type="message"]').last().hover();
		await this.page.locator('[data-qa-type="message"]').last().locator('[data-qa-type="message-action-menu"][data-qa-id="menu"]').waitFor();
		await this.page.locator('[data-qa-type="message"]').last().locator('[data-qa-type="message-action-menu"][data-qa-id="menu"]').click();
	}

	async openLastThreadMessageMenu(): Promise<void> {
		await this.page.locator('//main//aside >> [data-qa-type="message"]').last().hover();
		await this.page
			.locator('//main//aside >> [data-qa-type="message"]')
			.last()
			.locator('[data-qa-type="message-action-menu"][data-qa-id="menu"]')
			.waitFor();
		await this.page
			.locator('//main//aside >> [data-qa-type="message"]')
			.last()
			.locator('[data-qa-type="message-action-menu"][data-qa-id="menu"]')
			.click();
	}

	get takeOmnichannelChatButton(): Locator {
		return this.page.locator('role=button[name="Take it!"]');
	}

	get lastSystemMessageBody(): Locator {
		return this.page.locator('[data-qa-type="system-message-body"]').last();
	}

	get resumeOnHoldOmnichannelChatButton(): Locator {
		return this.page.locator('button.rcx-button--primary >> text=Resume');
	}

	get btnOnHold(): Locator {
		return this.page.locator('[data-qa-id="ToolBoxAction-pause-unfilled"]');
	}
}
