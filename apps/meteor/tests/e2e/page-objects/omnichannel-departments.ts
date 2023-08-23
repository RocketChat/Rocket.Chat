import type { Page, Locator } from '@playwright/test';

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

	async search(text: string) {
		await this.inputSearch.fill(text);
		await this.page.waitForTimeout(500);
	}

	get btnNew() {
		return this.page.locator('button.rcx-button >> text="Create department"');
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

	get invalidInputName() {
		return this.page.locator('[data-qa="DepartmentEditTextInput-Name"]:invalid');
	}

	get invalidInputEmail() {
		return this.page.locator('[data-qa="DepartmentEditTextInput-Email"]:invalid');
	}

	get btnTagsAdd() {
		return this.page.locator('[data-qa="DepartmentEditAddButton-ConversationClosingTags"]');
	}

	get btnSave() {
		return this.page.locator('button.rcx-button--primary.rcx-button >> text="Save"');
	}

	get btnBack() {
		return this.page.locator('button.rcx-button >> text=" Back"');
	}

	get allDepartmentsTab() {
		return this.page.locator('[role="tab"]:first-child');
	}

	get archivedDepartmentsTab() {
		return this.page.locator('[role="tab"]:nth-child(2)');
	}

	get firstRowInTable() {
		return this.page.locator('table tr:first-child td:first-child');
	}

	get firstRowInTableMenu() {
		return this.page.locator('table tr:first-child [data-testid="menu"]');
	}

	findDepartment(name: string) {
		return this.page.locator('tr', { has: this.page.locator(`td >> text="${name}`) });
	}

	selectedDepartmentMenu(name: string) {
		return this.page.locator('tr', { has: this.page.locator(`td >> text="${name}"`) }).locator('[data-testid="menu"]');
	}

	get menuEditOption() {
		return this.page.locator('[role=option][value="edit"]');
	}

	get menuDeleteOption() {
		return this.page.locator('[role=option][value="delete"]');
	}

	get menuArchiveOption() {
		return this.page.locator('[role=option][value="archive"]');
	}

	get menuUnarchiveOption() {
		return this.page.locator('[role=option][value="unarchive"]');
	}

	get inputModalConfirmDelete() {
		return this.page.locator('#modal-root .rcx-modal input');
	}

	get btnModalConfirmDelete() {
		return this.page.locator('#modal-root .rcx-modal .rcx-modal__footer .rcx-button--danger');
	}

	get upgradeDepartmentsModal() {
		return this.page.locator('[data-qa-id="enterprise-departments-modal"]');
	}

	get btnUpgradeDepartmentsModalClose() {
		return this.page.locator('[data-qa="modal-close"]');
	}

	get btnUpgradeDepartmentsModalTalkToSales() {
		return this.page.locator('[data-qa-id="talk-to-sales"]');
	}

	get btnUpgradeDepartmentsModalUpgrade() {
		return this.page.locator('[data-qa-id="upgrade-now"]');
	}

	get toastSuccess(): Locator {
		return this.page.locator('.rcx-toastbar.rcx-toastbar--success');
	}

	get btnCloseToastSuccess(): Locator {
		return this.toastSuccess.locator('button');
	}

	btnTag(tagName: string) {
		return this.page.locator('button', { hasText: tagName });
	}

	errorMessage(message: string): Locator {
		return this.page.locator(`.rcx-field__error >> text="${message}"`);
	}
}
