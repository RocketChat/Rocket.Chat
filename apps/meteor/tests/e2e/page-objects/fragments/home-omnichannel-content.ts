import type { Locator, Page } from '@playwright/test';

import { HomeContent } from './home-content';
import { OmnichannelTransferChatModal, OmnichannelReturnToQueueModal } from './modals';

export class HomeOmnichannelContent extends HomeContent {
	readonly forwardChatModal: OmnichannelTransferChatModal;

	readonly returnToQueueModal: OmnichannelReturnToQueueModal;

	constructor(page: Page) {
		super(page);
		this.forwardChatModal = new OmnichannelTransferChatModal(page);
		this.returnToQueueModal = new OmnichannelReturnToQueueModal(page);
	}

	get btnReturnToQueue(): Locator {
		return this.page.locator('role=button[name="Move to the queue"]');
	}

	get btnTakeChat(): Locator {
		return this.page.locator('role=button[name="Take it!"]');
	}

	get header(): Locator {
		return this.page.locator('header');
	}

	get btnReturn(): Locator {
		return this.header.getByRole('button', { name: 'Back' });
	}

	get btnResume(): Locator {
		return this.page.locator('role=button[name="Resume"]');
	}

	get infoHeaderName(): Locator {
		return this.page.locator('.rcx-room-header').getByRole('heading');
	}

	/**
	 * FIXME: useX naming convention should be exclusively for react hooks
	 **/
	async useCannedResponse(cannedResponseName: string): Promise<void> {
		await this.composer.inputMessage.pressSequentially('!');
		await this.page.locator('[role="menu"][name="ComposerBoxPopup"]').waitFor({ state: 'visible' });
		await this.composer.inputMessage.pressSequentially(cannedResponseName);
		await this.page.keyboard.press('Enter');
	}
}
