import type { Locator, Page } from '@playwright/test';

import { OmnichannelAdmin } from './omnichannel-admin';
import { ConfirmDeleteModal } from '../fragments';
import { FlexTab } from '../fragments/flextab';
import { Table } from '../fragments/table';

export class OmnichannelUnitFlexTab extends FlexTab {
	readonly deleteModal: ConfirmDeleteModal;

	constructor(page: Locator) {
		super(page);
		this.deleteModal = new ConfirmDeleteModal(page);
	}

	get fieldDepartments() {
		return this.root.getByLabel('Departments');
	}

	get inputDepartments() {
		return this.fieldDepartments.getByRole('textbox');
	}

	get inputMonitors() {
		return this.root.locator('[name="monitors"]');
	}

	get inputVisibility(): Locator {
		return this.root.locator('button', { has: this.root.locator('select[name="visibility"]') });
	}

	private findOption(name: string) {
		return this.root.locator('#position-container').getByRole('option', { name, exact: true });
	}

	public findDepartmentsChipOption(name: string) {
		return this.fieldDepartments.getByRole('option', { name, exact: true });
	}

	async selectDepartment(name: string) {
		await this.inputDepartments.click();
		await this.inputDepartments.fill(name);
		await this.findOption(name).click();
		await this.inputDepartments.click();
	}

	async selectMonitor(option: string) {
		await this.inputMonitors.click();
		await this.findOption(option).click();
		await this.inputMonitors.click();
	}

	async selectVisibility(option: string) {
		await this.inputVisibility.click();
		await this.root.locator(`li.rcx-option[data-key="${option}"]`).click();
	}

	async deleteUnit() {
		await this.btnDelete.click();
		await this.deleteModal?.confirmDelete();
		await this.waitForDismissal();
	}
}

class OmnichannelUnitsTable extends Table {
	constructor(page: Locator) {
		super(page);
	}

	deleteUnitByName(name: string) {
		return this.findRowByName(name).getByRole('button', { name: 'Remove' });
	}
}

export class OmnichannelUnits extends OmnichannelAdmin {
	readonly editUnit: OmnichannelUnitFlexTab;

	readonly table: OmnichannelUnitsTable;

	constructor(page: Page) {
		super(page);
		this.editUnit = new OmnichannelUnitFlexTab(page.getByRole('dialog', { name: 'Edit Unit' }));
		this.table = new OmnichannelUnitsTable(page.getByRole('table', { name: 'Units' }));
	}

	get btnCreateUnit() {
		return this.createByName('unit');
	}

	async deleteUnit(name: string) {
		await this.table.deleteUnitByName(name).click();
		await this.deleteModal.confirmDelete();
	}
}
