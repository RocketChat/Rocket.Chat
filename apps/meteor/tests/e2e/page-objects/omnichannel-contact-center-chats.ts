import type { Locator, Page } from '@playwright/test';

import { HomeOmnichannelContent } from './fragments';
import { FlexTab } from './fragments/flextab';
import { Modal } from './fragments/modal';
import { OmnichannelAdministration } from './omnichannel-administration';
import { OmnichannelChatsFilters } from './omnichannel-contact-center-chats-filters';

class ConfirmRemoveChat extends Modal {
	constructor(page: Page) {
		super(page.getByRole('dialog'));
	}

	private get btnConfirmRemove(): Locator {
		return this.root.getByRole('button', { name: 'Delete' });
	}

	async confirm() {
		await this.btnConfirmRemove.click();
		await this.waitForDismissal();
	}
}

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

export class OmnichannelChats extends OmnichannelAdministration {
	private readonly confirmRemoveChatModal: ConfirmRemoveChat;

	private readonly conversation: ConversationFlexTab;

	readonly filters: OmnichannelChatsFilters;

	readonly content: HomeOmnichannelContent;

	constructor(page: Page) {
		super(page);
		this.filters = new OmnichannelChatsFilters(page);
		this.confirmRemoveChatModal = new ConfirmRemoveChat(page);
		this.content = new HomeOmnichannelContent(page);
		this.conversation = new ConversationFlexTab(page);
	}

	get btnFilters(): Locator {
		return this.page.locator('role=button[name="Filters"]');
	}

	get inputSearch(): Locator {
		return this.page.locator('role=textbox[name="Search"]');
	}

	findRowByName(contactName: string) {
		return this.page.locator(`td >> text="${contactName}"`);
	}

	get inputServedBy(): Locator {
		return this.page.locator('[data-qa="autocomplete-agent"] input');
	}

	get inputStatus(): Locator {
		return this.page.locator('[data-qa="current-chats-status"]');
	}

	get inputDepartment(): Locator {
		return this.page.locator('[data-qa="autocomplete-department"] input');
	}

	get inputDepartmentValue(): Locator {
		return this.page.locator('[data-qa="autocomplete-department"] span');
	}

	get inputTags(): Locator {
		return this.page.locator('[data-qa="current-chats-tags"] [role="listbox"]');
	}

	get modalConfirmRemoveAllClosed(): Locator {
		return this.page.locator('[data-qa-id="current-chats-modal-remove-all-closed"]');
	}

	async selectServedBy(option: string) {
		await this.inputServedBy.click();
		await this.inputServedBy.fill(option);
		await this.page.locator(`[role='option'][value='${option}']`).click();
	}

	async addTag(option: string) {
		await this.inputTags.click();
		await this.page.locator(`[role='option'][value='${option}']`).click();
		await this.inputTags.click();
	}

	async removeTag(option: string) {
		await this.page.locator(`role=option[name='${option}']`).click();
	}

	async selectDepartment(option: string) {
		await this.inputDepartment.click();
		await this.inputDepartment.fill(option);
		await this.page.locator(`role=option[name='${option}']`).click();
	}

	async selectStatus(option: string) {
		await this.inputStatus.click();
		await this.page.locator(`[role='option'][data-key='${option}']`).click();
	}

	btnRemoveByName(name: string): Locator {
		return this.findRowByName(name).locator('role=button[name="Remove"]');
	}

	async removeChatByName(name: string) {
		await this.btnRemoveByName(name).click();
		await this.confirmRemoveChatModal.confirm();
	}

	async openChat(name: string) {
		await this.findRowByName(name).click();
		await this.conversation.openChat();
	}
}
