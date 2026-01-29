import type { Locator, Page } from '@playwright/test';

import { OmnichannelAdmin } from './omnichannel-admin';
import { FlexTab } from '../fragments/flextab';
import { Listbox } from '../fragments/listbox';
import { Table } from '../fragments/table';

export class OmnichannelUnitFlexTab extends FlexTab {
	readonly listbox: Listbox;

	constructor(page: Page) {
		super(page.getByRole('dialog', { name: 'unit' }));
		this.listbox = new Listbox(page);
	}

	private get fieldDepartments() {
		return this.root.getByLabel('Departments');
	}

	get inputDepartments() {
		return this.fieldDepartments.getByRole('textbox');
	}

	private get fieldMonitors() {
		return this.root.getByLabel('Monitors');
	}

	get inputMonitors() {
		return this.fieldMonitors.getByRole('textbox');
	}

	get inputVisibility(): Locator {
		return this.root.getByText('Visibility');
	}

	findDepartmentsChipOption(name: string) {
		return this.fieldDepartments.getByRole('option', { name, exact: true });
	}

	findMonitorChipOption(name: string) {
		return this.fieldMonitors.getByRole('option', { name, exact: true });
	}

	async selectDepartment(name: string) {
		await this.inputDepartments.click();
		await this.inputDepartments.fill(name);
		await this.listbox.selectOption(name);
		await this.inputDepartments.click();
	}

	async selectMonitor(option: string) {
		await this.inputMonitors.click();
		await this.listbox.selectOption(option);
		await this.inputMonitors.click();
	}

	async removeMonitor(option: string) {
		await this.findMonitorChipOption(option).click();
	}

	async selectVisibility(option: string) {
		await this.inputVisibility.click();
		await this.listbox.selectOption(option);
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
	readonly manageUnit: OmnichannelUnitFlexTab;

	readonly table: OmnichannelUnitsTable;

	constructor(page: Page) {
		super(page);
		this.manageUnit = new OmnichannelUnitFlexTab(page);
		this.table = new OmnichannelUnitsTable(page.getByRole('table', { name: 'Units' }));
	}

	async createNew() {
		await this.getButtonByType('unit').click();
	}

	async deleteUnit(name: string) {
		await this.table.deleteUnitByName(name).click();
		await this.deleteModal.confirmDelete();
	}
}
