import type { Locator, Page } from '@playwright/test';

import { OmnichannelTransferChatModal } from '../omnichannel-transfer-chat-modal';
import { HomeContent } from './home-content';
import { OmnichannelCloseChatModal } from './omnichannel-close-chat-modal';

export class HomeOmnichannelContent extends HomeContent {
	readonly closeChatModal: OmnichannelCloseChatModal;

	readonly forwardChatModal: OmnichannelTransferChatModal;

	constructor(page: Page) {
		super(page);
		this.closeChatModal = new OmnichannelCloseChatModal(page);
		this.forwardChatModal = new OmnichannelTransferChatModal(page);
	}

	get btnReturnToQueue(): Locator {
		return this.page.locator('role=button[name="Move to the queue"]');
	}

	get modalReturnToQueue(): Locator {
		return this.page.locator('[data-qa-id="return-to-queue-modal"]');
	}

	get btnReturnToQueueConfirm():Locator {
		return this.modalReturnToQueue.locator('role=button[name="Confirm"]');
	}

	get btnReturnToQueueCancel():Locator {
		return this.modalReturnToQueue.locator('role=button[name="Cancel"]');
	}

	get btnTakeChat(): Locator {
		return this.page.locator('role=button[name="Take it!"]');
	}

	get inputMessage(): Locator {
		return this.page.locator('[name="msg"]');
	}

	get btnForwardChat(): Locator {
		return this.page.locator('[data-qa-id="ToolBoxAction-balloon-arrow-top-right"]');
	}

	get btnCloseChat(): Locator {
		return this.page.locator('[data-qa-id="ToolBoxAction-balloon-close-top-right"]');
	}

	get btnReturn(): Locator {
		return this.page.locator('[data-qa-id="ToolBoxAction-back"]');
	}

	get btnResume(): Locator {
		return this.page.locator('role=button[name="Resume"]');
	}

	get modalOnHold(): Locator {
		return this.page.locator('[data-qa-id="on-hold-modal"]');
	}

	get btnEditRoomInfo(): Locator {
		return this.page.locator('button[data-qa-id="room-info-edit"]');
	}

	get btnOnHoldConfirm(): Locator {
		return this.modalOnHold.locator('role=button[name="Place chat On-Hold"]');
	}
}
