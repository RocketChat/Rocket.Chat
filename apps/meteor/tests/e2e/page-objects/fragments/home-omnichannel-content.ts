import type { Locator, Page } from '@playwright/test';

import { HomeContent } from './home-content';
import { OmnichannelCloseChatModal } from './omnichannel-close-chat-modal';

export class HomeOmnichannelContent extends HomeContent {
	readonly omnichannelCloseChatModal: OmnichannelCloseChatModal;

	constructor(page: Page) {
		super(page);
		this.omnichannelCloseChatModal = new OmnichannelCloseChatModal(page);
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
}
