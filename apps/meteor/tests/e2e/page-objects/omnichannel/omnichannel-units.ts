import type { Locator } from '@playwright/test';

import { OmnichannelAdmin } from './omnichannel-admin';
import { FlexTab } from '../fragments/flextab';

export class OmnichannelUnitFlexTab extends FlexTab {
	constructor(page: Locator) {
		super(page);
	}

	get btnSave() {
		return this.root.locator('role=button[name="Save"]');
	}

	get btnCancel() {
		return this.root.locator('role=button[name="Cancel"]');
	}

	get btnDelete() {
		return this.root.locator('role=button[name="Delete"]');
	}
}

export class OmnichannelUnits extends OmnichannelAdmin {
	findRowByName(name: string) {
		return this.page.locator(`tr[data-qa-id="${name}"]`);
	}

	get inputName() {
		return this.page.locator('[name="name"]');
	}

	get fieldDepartments() {
		return this.page.getByLabel('Departments');
	}

	get inputDepartments() {
		return this.fieldDepartments.getByRole('textbox');
	}

	get inputMonitors() {
		return this.page.locator('[name="monitors"]');
	}

	get inputVisibility(): Locator {
		return this.page.locator('button', { has: this.page.locator('select[name="visibility"]') });
	}

	private findOption(name: string) {
		return this.page.locator('#position-container').getByRole('option', { name, exact: true });
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
		await this.page.locator(`li.rcx-option[data-key="${option}"]`).click();
	}

	get btnCreateUnit() {
		return this.createByName('unit');
	}

	btnDeleteByName(name: string) {
		return this.page.locator(`button[data-qa-id="remove-unit-${name}"]`);
	}
}
