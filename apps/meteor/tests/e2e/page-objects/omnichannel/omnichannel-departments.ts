import type { Locator, Page } from '@playwright/test';

import { OmnichannelAdmin } from './omnichannel-admin';
import { Table } from '../fragments/table';

class OmnichannelDepartmentsTable extends Table {
	constructor(page: Page) {
		super(page.getByRole('table', { name: 'Departments' }));
	}
}

export class OmnichannelDepartments extends OmnichannelAdmin {
	readonly table: OmnichannelDepartmentsTable;

	constructor(page: Page) {
		super(page);
		this.table = new OmnichannelDepartmentsTable(page);
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

	get archivedDepartmentsTab() {
		return this.page.locator('[role="tab"]:nth-child(2)');
	}

	// TODO: remove data-qa
	getDepartmentMenuByName(name: string) {
		return this.table.findRowByName(name).locator('[data-testid="menu"]');
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

	async archiveDepartmentByName(name: string) {
		await this.getDepartmentMenuByName(name).click();
		await this.menuArchiveOption.click();
		await this.toastMessage.waitForDisplay();
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

	get upgradeDepartmentsModal() {
		return this.page.locator('[data-qa-id="enterprise-departments-modal"]');
	}

	get btnUpgradeDepartmentsModalClose() {
		return this.page.locator('[data-qa="modal-close"]');
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

	async createDepartment(departmentName: string, email: string) {
		await this.btnEnabled.click();
		await this.inputName.fill(departmentName);
		await this.inputEmail.fill(email);
		await this.btnSave.click();
		await this.toastMessage.dismissToast();
	}
}
