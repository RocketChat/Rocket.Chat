import type { Locator, Page } from '@playwright/test';

import { OmnichannelAdmin } from './omnichannel-admin';
import { MenuOptions } from '../fragments';
import { Listbox } from '../fragments/listbox';
import { OmnichannelUpsellDepartmentsModal, ConfirmDeleteDepartmentModal } from '../fragments/modals';
import { Table } from '../fragments/table';

class OmnichannelDepartmentsTable extends Table {
	constructor(page: Page) {
		super(page.getByRole('table', { name: 'Departments' }));
	}
}

class OmnichannelDepartmentAgentsTable extends Table {
	constructor(page: Page) {
		super(page.getByRole('table', { name: 'Agents' }));
	}
}

export class OmnichannelDepartments extends OmnichannelAdmin {
	readonly departmentsTable: OmnichannelDepartmentsTable;

	readonly agentsTable: OmnichannelDepartmentAgentsTable;

	readonly upsellDepartmentsModal: OmnichannelUpsellDepartmentsModal;

	readonly listbox: Listbox;

	readonly menOptions: MenuOptions;

	override readonly deleteModal: ConfirmDeleteDepartmentModal;

	constructor(page: Page) {
		super(page);
		this.departmentsTable = new OmnichannelDepartmentsTable(page);
		this.agentsTable = new OmnichannelDepartmentAgentsTable(page);
		this.upsellDepartmentsModal = new OmnichannelUpsellDepartmentsModal(page);
		this.listbox = new Listbox(page);
		this.menOptions = new MenuOptions(page);
		this.deleteModal = new ConfirmDeleteDepartmentModal(page);
	}

	async createNew() {
		await this.getButtonByType('department').click();
	}

	get labelEnabled() {
		return this.page.locator('label', { hasText: 'Enabled' });
	}

	get inputName() {
		return this.page.getByRole('textbox', { name: 'Name', exact: true });
	}

	get inputEmail() {
		return this.page.getByRole('textbox', { name: 'Email', exact: true });
	}

	get inputConversationClosingTags() {
		return this.page.getByRole('textbox', { name: 'Conversation closing tags', exact: true });
	}

	get btnAddTags() {
		return this.page.getByText('Conversation closing tags', { exact: true }).locator('..').getByRole('button', { name: 'Add' });
	}

	get btnSave() {
		return this.page.getByRole('button', { name: 'Save', exact: true });
	}

	get tabArchivedDepartments() {
		return this.page.getByRole('tab', { name: 'Archived' });
	}

	getDepartmentMenuByName(name: string) {
		return this.departmentsTable.findRowByName(name).getByRole('button', { name: 'Options' });
	}

	get menuEditOption() {
		return this.menOptions.getMenuItem('Edit');
	}

	get menuDeleteOption() {
		return this.menOptions.getMenuItem('Delete');
	}

	get menuArchiveOption() {
		return this.menOptions.getMenuItem('Archive');
	}

	get menuUnarchiveOption() {
		return this.menOptions.getMenuItem('Unarchive');
	}

	async archiveDepartmentByName(name: string) {
		await this.getDepartmentMenuByName(name).click();
		await this.menuArchiveOption.click();
		await this.toastMessage.waitForDisplay();
	}

	get inputUnit(): Locator {
		return this.page.getByLabel('Unit').getByRole('textbox', { name: 'Select an option' });
	}

	btnTag(tagName: string) {
		return this.page.locator('button', { hasText: tagName });
	}

	errorMessage(message: string): Locator {
		return this.page.locator(`[role="alert"] >> text="${message}"`);
	}

	findOption(optionText: string) {
		return this.listbox.getOption(optionText);
	}

	async selectUnit(unitName: string) {
		await this.inputUnit.click();
		await this.listbox.selectOption(unitName);
	}

	get inputAgents() {
		return this.page.getByRole('group', { name: 'Agents' }).getByRole('textbox');
	}

	get btnAddAgent() {
		return this.page.getByRole('group', { name: 'Agents' }).getByRole('button', { name: 'Add', exact: true });
	}

	async createDepartment(departmentName: string, email: string) {
		await this.labelEnabled.click();
		await this.inputName.fill(departmentName);
		await this.inputEmail.fill(email);
		await this.btnSave.click();
		await this.toastMessage.dismissToast();
	}
}
