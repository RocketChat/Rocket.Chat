import type { Locator, Page } from '@playwright/test';

import { HomeOmnichannelContent } from './fragments';
import { OmnichannelAdministration } from './omnichannel-administration';

export class OmnichannelCurrentChats extends OmnichannelAdministration {
	readonly content: HomeOmnichannelContent;

	constructor(page: Page) {
		super(page);
		this.content = new HomeOmnichannelContent(page);
	}

	get inputGuest(): Locator {
		return this.page.locator('[data-qa="current-chats-guest"]');
	}

	get inputServedBy(): Locator {
		return this.page.locator('[data-qa="autocomplete-agent"] input');
	}

	get inputStatus(): Locator {
		return this.page.locator('[data-qa="current-chats-status"]');
	}

	get inputFrom(): Locator {
		return this.page.locator('[data-qa="current-chats-from"]');
	}

	get inputTo(): Locator {
		return this.page.locator('[data-qa="current-chats-to"]');
	}

	get inputDepartment(): Locator {
		return this.page.locator('[data-qa="autocomplete-department"] input');
	}

	get inputTags(): Locator {
		return this.page.locator('[data-qa="current-chats-tags"] [role="listbox"]');
	}

	get btnFilterOptions(): Locator {
		return this.page.locator('[data-qa="current-chats-options"]');
	}

	get optionClearFilter(): Locator {
		return this.page.locator('[data-qa="current-chats-options-clearFilters"]');
	}

	get optionRemoveAllClosed(): Locator {
		return this.page.locator('[data-qa="current-chats-options-removeAllClosed"]');
	}

	get modalConfirmRemove(): Locator {
		return this.page.locator('[data-qa-id="current-chats-modal-remove"]');
	}

	get modalConfirmRemoveAllClosed(): Locator {
		return this.page.locator('[data-qa-id="current-chats-modal-remove-all-closed"]');
	}

	get btnConfirmRemove(): Locator {
		return this.modalConfirmRemove.locator('role=button[name="Delete"]');
	}

	get btnConfirmRemoveAllClosed(): Locator {
		return this.modalConfirmRemoveAllClosed.locator('role=button[name="Delete"]');
	}

	get optionCustomFields(): Locator {
		return this.page.locator('[data-qa="current-chats-options-customFields"]');
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

	findRowByName(name: string) {
		return this.page.locator(`tr[data-qa-id="${name}"]`);
	}

	findRowByServer(name: string) {
		return this.page.locator('tr', { has: this.page.locator(`[data-qa="current-chats-cell-servedBy"] >> text=${name}`) });
	}
}
