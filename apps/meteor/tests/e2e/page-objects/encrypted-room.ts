import { HomeContent, HomeFlextab } from './fragments';
import { Message } from './fragments/message';
import { DisableRoomEncryptionModal, EnableRoomEncryptionModal } from './fragments/modals';

export class EncryptedRoomPage extends HomeContent {
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
		const tabs = new HomeFlextab(this.page);

		const enableRoomEncryptionModal = new EnableRoomEncryptionModal(this.page);

		await tabs.kebab.click();
		await tabs.btnEnableE2E.click();
		await enableRoomEncryptionModal.enable();
	}

	async disableEncryption() {
		const tabs = new HomeFlextab(this.page);
		const disableRoomEncryptionModal = new DisableRoomEncryptionModal(this.page);

		await tabs.kebab.click();
		await tabs.btnDisableE2E.click();
		await disableRoomEncryptionModal.disable();
	}

	async showExportMessagesTab() {
		const tabs = new HomeFlextab(this.page);

		await tabs.kebab.click();
		await tabs.btnExportMessages.click();
	}
}
