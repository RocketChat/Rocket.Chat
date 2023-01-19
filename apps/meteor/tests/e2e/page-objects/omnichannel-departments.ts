import type { Page } from '@playwright/test';

import { OmnichannelSidenav } from './fragments';

export class OmnichannelDepartments {
	private readonly page: Page;

	readonly sidenav: OmnichannelSidenav;

	constructor(page: Page) {
		this.page = page;
		this.sidenav = new OmnichannelSidenav(page);
	}

	get inputSearch() {
		return this.page.locator('[placeholder="Search"]');
	}

	get btnNew() {
		return this.page.locator('button.rcx-button >> text="New"');
	}

	get btnEnabled() {
		return this.page.locator('[data-qa="DepartmentEditToggle-Enabled"] span label');
	}

	get inputName() {
		return this.page.locator('[data-qa="DepartmentEditTextInput-Name"]');
	}

	get inputEmail() {
		return this.page.locator('[data-qa="DepartmentEditTextInput-Email"]');
	}

	get toggleRequestTags() {
		return this.page.locator('[data-qa="DiscussionToggle-RequestTagBeforeCLosingChat"] span label');
	}

	get inputTags() {
		return this.page.locator('[data-qa="DepartmentEditTextInput-ConversationClosingTags"]');
	}

	get invalidInputTags() {
		return this.page.locator('[data-qa="DepartmentEditTextInput-ConversationClosingTags"]:invalid');
	}

	get btnTagsAdd() {
		return this.page.locator('[data-qa="DepartmentEditAddButton-ConversationClosingTags"]');
	}

	get btnSave() {
		return this.page.locator('button.rcx-button--primary.rcx-button >> text="Save"');
	}

	get firstRowInTable() {
		return this.page.locator('table tr:first-child td:first-child');
	}

	get btnDeleteFirstRowInTable() {
		return this.page.locator('table tr:first-child td:nth-child(6) button');
	}

	get btnModalConfirmDelete() {
		return this.page.locator('#modal-root .rcx-modal .rcx-modal__footer .rcx-button--danger');
	}

	get selectAgentToAdd() {
		return this.page.locator('[data-qa="autocomplete-agent"]');
	}

	getAgentOptionToAdd(agentName: string) {
		return this.page.locator(`div.rcx-option__content >> text="${agentName}"`);
	}

	get btnAddAgent() {
		return this.page.locator('button.rcx-button--primary.rcx-button >> text="Add"');
	}

	findRowByName(name: string) {
		return this.page.locator('td', { has: this.page.locator(`div >> text="${name}"`) });
	}

	findAgentRemoveBtn(name: string) {
		return this.page.locator('tr', { has: this.page.locator(`div >> text="${name}"`) }).locator('button.rcx-button');
	}
}
