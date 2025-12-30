import type { Locator, Page } from '@playwright/test';

import { OmnichannelContactCenter } from './omnichannel-contact-center';
import { FlexTab } from '../../fragments/flextab';
import { OmnichannelConfirmRemoveChat } from '../../fragments/modals';
import { Table } from '../../fragments/table';

class ConversationFlexTab extends FlexTab {
	constructor(page: Page) {
		super(page.getByRole('dialog', { name: 'Conversation' }));
	}

	private get btnOpenChat(): Locator {
		return this.root.getByRole('button', { name: 'Open chat' });
	}

	async openChat() {
		await this.btnOpenChat.click();
		await this.waitForDismissal();
	}
}

export class OmnichannelChatsFilters extends FlexTab {
	constructor(page: Page) {
		super(page.getByRole('dialog', { name: 'Filters' }));
	}

	get inputFrom(): Locator {
		return this.root.locator('input[name="from"]');
	}

	get inputTo(): Locator {
		return this.root.locator('input[name="to"]');
	}

	get btnApply(): Locator {
		return this.root.locator('role=button[name="Apply"]');
	}
}

class OmnichannelContactCenterChatsTable extends Table {
	constructor(page: Page) {
		super(page.getByRole('table', { name: 'Omnichannel Contact Center Chats' }));
	}

	btnRemoveByName(name: string): Locator {
		return this.findRowByName(name).getByRole('button', { name: 'Remove' });
	}
}

export class OmnichannelContactCenterChats extends OmnichannelContactCenter {
	readonly filters: OmnichannelChatsFilters;

	readonly confirmRemoveChatModal: OmnichannelConfirmRemoveChat;

	readonly conversation: ConversationFlexTab;

	readonly table: OmnichannelContactCenterChatsTable;

	constructor(page: Page) {
		super(page);
		this.filters = new OmnichannelChatsFilters(page);
		this.confirmRemoveChatModal = new OmnichannelConfirmRemoveChat(page);
		this.conversation = new ConversationFlexTab(page);
	}

	async removeChatByName(name: string) {
		await this.table.btnRemoveByName(name).click();
		await this.confirmRemoveChatModal.confirm();
	}

	async openChat(name: string) {
		await this.table.findRowByName(name).click();
		await this.conversation.openChat();
		await this.page.locator('#main-content').waitFor();
	}
}
