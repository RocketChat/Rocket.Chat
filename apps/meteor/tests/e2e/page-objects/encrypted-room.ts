import type { Page } from '@playwright/test';

import { EncryptedRoomToolbar, HomeContent } from './fragments';
import { Message } from './fragments/message';
import { DisableRoomEncryptionModal, EnableRoomEncryptionModal } from './fragments/modals';

export class EncryptedRoomPage extends HomeContent {
	readonly toolbar: EncryptedRoomToolbar;

	constructor(page: Page) {
		super(page);
		this.toolbar = new EncryptedRoomToolbar(page);
	}

	get encryptedTitle() {
		return this.page.getByRole('button', { name: '- encrypted' });
	}

	get encryptionNotReadyIndicator() {
		return this.page.getByText("You're sending an unencrypted message");
	}

	get lastMessage() {
		return new Message(this.page.locator('[data-qa-type="message"]').last());
	}

	lastNthMessage(index: number) {
		return new Message(this.page.locator(`[data-qa-type="message"]`).nth(-index - 1));
	}

	async enableEncryption() {
		const enableRoomEncryptionModal = new EnableRoomEncryptionModal(this.page);

		await this.toolbar.openMoreOptions();
		await this.toolbar.btnEnableE2EEncryption.click();
		await enableRoomEncryptionModal.enable();
	}

	async disableEncryption() {
		const disableRoomEncryptionModal = new DisableRoomEncryptionModal(this.page);

		await this.toolbar.openMoreOptions();
		await this.toolbar.btnDisableE2EEncryption.click();
		await disableRoomEncryptionModal.disable();
	}

	async showExportMessagesTab() {
		await this.toolbar.openMoreOptions();
		await this.toolbar.menuItemExportMessages.click();
	}
}
