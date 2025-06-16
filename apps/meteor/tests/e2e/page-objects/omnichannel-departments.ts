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
		return this.page.getByRole('main').getByRole('textbox', { name: 'Search' });
	}

	async search(text: string) {
		await this.inputSearch.fill(text);
		await this.page.waitForTimeout(500);
	}

	headingButtonNew(name: string) {
		return this.page.locator(`role=main >> role=button[name="${name}"]`).first();
	}

	get btnEnabled() {
		return this.page.locator('label >> text="Enabled"');
	}

	get inputName() {
		return this.page.locator('[data-qa="DepartmentEditTextInput-Name"]');
	}

	get inputEmail() {
		return this.page.locator('[data-qa="DepartmentEditTextInput-Email"]');
	}

	get toggleRequestTags() {
		return this.page.locator('label >> text="Request tag(s) before closing conversation"');
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
		return this.page.locator('role=button[name="Save"]');
	}

	get btnBack() {
		return this.page.locator('role=button[name="Back"]');
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
		return this.page.locator('tr', { has: this.page.locator(`td >> text="${name}"`) });
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
		return this.modalConfirmDelete.locator('input[name="confirmDepartmentName"]');
	}

	get modalConfirmDelete() {
		return this.page.locator('[data-qa-id="delete-department-modal"]');
	}

	get btnModalConfirmDelete() {
		return this.modalConfirmDelete.locator('role=button[name="Delete"]');
	}

	get btnModalCancelDelete() {
		return this.modalConfirmDelete.locator('role=button[name="Cancel"]');
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

	get inputUnit(): Locator {
		// TODO: Improve PaginatedSelectFiltered to allow for more accessible locators
		return this.page.locator('[data-qa="autocomplete-unit"] input');
	}

	btnTag(tagName: string) {
		return this.page.locator('button', { hasText: tagName });
	}

	errorMessage(message: string): Locator {
		return this.page.locator(`.rcx-field__error >> text="${message}"`);
	}

	findOption(optionText: string) {
		return this.page.locator(`role=option[name="${optionText}"]`);
	}

	async selectUnit(unitName: string) {
		await this.inputUnit.click();
		await this.findOption(unitName).click();
	}

	get fieldGroupAgents() {
		return this.page.getByLabel('Agents', { exact: true });
	}

	get inputAgents() {
		return this.fieldGroupAgents.getByRole('textbox');
	}

	get btnAddAgent() {
		return this.fieldGroupAgents.getByRole('button', { name: 'Add', exact: true });
	}

	findAgentRow(name: string) {
		return this.page.locator('tr', { has: this.page.getByText(name, { exact: true }) });
	}
}
