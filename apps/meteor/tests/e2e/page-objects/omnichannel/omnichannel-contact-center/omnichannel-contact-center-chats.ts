import type { Locator, Page } from '@playwright/test';

import { OmnichannelContactCenter } from './omnichannel-contact-center';
import { FlexTab } from '../../fragments/flextab';
import { Listbox } from '../../fragments/listbox';
import { OmnichannelConfirmRemoveChat } from '../../fragments/modals';
import { Table } from '../../fragments/table';

class OmnichannelConversationFlexTab extends FlexTab {
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
	readonly listbox: Listbox;

	constructor(page: Page) {
		super(page.getByRole('dialog', { name: 'Filters' }));
		this.listbox = new Listbox(page);
	}

	get inputFrom(): Locator {
		return this.root.locator('input[name="from"]');
	}

	get inputTo(): Locator {
		return this.root.locator('input[name="to"]');
	}

	get btnApply(): Locator {
		return this.root.getByRole('button', { name: 'Apply' });
	}

	get inputServedBy(): Locator {
		return this.root.getByLabel('Served By').locator('input');
	}

	get inputDepartment(): Locator {
		return this.root.getByLabel('Department').locator('input');
	}

	get selectStatusContainer(): Locator {
		return this.root.getByRole('button', { name: 'Status' });
	}

	get inputTags(): Locator {
		return this.root.getByLabel('Tags').locator('input');
	}

	get inputUnits(): Locator {
		return this.root.getByLabel('Units').locator('input');
	}

	get btnClearFilters(): Locator {
		return this.root.getByRole('button', { name: 'Clear filters' });
	}

	async selectServedBy(option: string) {
		await this.inputServedBy.click();
		await this.inputServedBy.fill(option);
		await this.listbox.selectOption(option);
		await this.btnApply.click();
	}

	async selectStatus(option: string) {
		await this.selectStatusContainer.click();
		await this.listbox.selectOption(option);
		await this.btnApply.click();
	}

	async selectDepartment(option: string) {
		await this.inputDepartment.click();
		await this.inputDepartment.fill(option);
		await this.listbox.selectOption(option);
		await this.inputDepartment.click();
		await this.btnApply.click();
	}

	async selectTag(option: string) {
		await this.inputTags.click();
		await this.inputTags.fill(option);
		await this.listbox.selectOption(option);
		await this.inputTags.click();
		await this.btnApply.click();
	}

	async removeTag(option: string) {
		await this.inputTags.click();
		await this.listbox.selectOption(option);
		await this.inputTags.click();
		await this.btnApply.click();
	}

	async selectUnit(unitName: string) {
		await this.inputUnits.click();
		await this.inputUnits.fill(unitName);
		await this.listbox.selectOption(unitName);
		await this.btnApply.click();
	}

	async addTag(option: string) {
		await this.inputTags.click();
		await this.listbox.selectOption(option);
		await this.inputTags.click();
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

	readonly conversation: OmnichannelConversationFlexTab;

	readonly table: OmnichannelContactCenterChatsTable;

	constructor(page: Page) {
		super(page);
		this.filters = new OmnichannelChatsFilters(page);
		this.confirmRemoveChatModal = new OmnichannelConfirmRemoveChat(page);
		this.conversation = new OmnichannelConversationFlexTab(page);
		this.table = new OmnichannelContactCenterChatsTable(page);
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

	get btnFilters(): Locator {
		return this.page.getByRole('button', { name: 'Filters' });
	}

	btnStatusChip(name: string): Locator {
		return this.page.getByRole('button', { name: `Status: ${name}` });
	}

	btnServedByChip(name: string): Locator {
		return this.page.getByRole('button', { name: `Served by: ${name}` });
	}

	btnDepartmentChip(name: string): Locator {
		return this.page.getByRole('button', { name: `Department: ${name}` });
	}

	btnSearchChip(name: string): Locator {
		return this.page.getByRole('button', { name: `Text: ${name}` });
	}

	btnUnitsChip(name: string): Locator {
		return this.page.getByRole('button', { name: `Units: ${name}` });
	}
}
