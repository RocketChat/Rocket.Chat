import type { Locator, Page } from '@playwright/test';

import { OmnichannelTransferChatModal } from '../omnichannel-transfer-chat-modal';
import { HomeContent } from './home-content';
import { OmnichannelContactReviewModal } from '../omnichannel-contact-review-modal';

export class HomeOmnichannelContent extends HomeContent {
	readonly forwardChatModal: OmnichannelTransferChatModal;

	readonly contactReviewModal: OmnichannelContactReviewModal;

	constructor(page: Page) {
		super(page);
		this.forwardChatModal = new OmnichannelTransferChatModal(page);
		this.contactReviewModal = new OmnichannelContactReviewModal(page);
	}

	get btnReturnToQueue(): Locator {
		return this.page.locator('role=button[name="Move to the queue"]');
	}

	get modalReturnToQueue(): Locator {
		return this.page.locator('[data-qa-id="return-to-queue-modal"]');
	}

	get btnReturnToQueueConfirm(): Locator {
		return this.modalReturnToQueue.locator('role=button[name="Confirm"]');
	}

	get btnReturnToQueueCancel(): Locator {
		return this.modalReturnToQueue.locator('role=button[name="Cancel"]');
	}

	get btnTakeChat(): Locator {
		return this.page.locator('role=button[name="Take it!"]');
	}

	override get inputMessage(): Locator {
		return this.page.locator('[name="msg"]');
	}

	get contactContextualBar() {
		return this.page.getByRole('dialog', { name: 'Contact' });
	}

	get infoContactEmail(): Locator {
		return this.contactContextualBar.getByRole('list', { name: 'Email' }).getByRole('listitem').first().locator('p');
	}

	get btnReturn(): Locator {
		return this.page.getByRole('button', { name: 'Back' });
	}

	get btnResume(): Locator {
		return this.page.locator('role=button[name="Resume"]');
	}

	get infoHeaderName(): Locator {
		return this.page.locator('.rcx-room-header').getByRole('heading');
	}

	async useCannedResponse(cannedResponseName: string): Promise<void> {
		await this.inputMessage.pressSequentially('!');
		await this.page.locator('[role="menu"][name="ComposerBoxPopup"]').waitFor({ state: 'visible' });
		await this.inputMessage.pressSequentially(cannedResponseName);
		await this.page.keyboard.press('Enter');
	}
}
