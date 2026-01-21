import type { Locator, Page } from '@playwright/test';

import { OmnichannelAdmin } from './omnichannel-admin';
import { Listbox } from '../fragments/listbox';
import { Table } from '../fragments/table';

class OmnichannelBusinessHoursTable extends Table {
	constructor(page: Page) {
		super(page.getByRole('table', { name: 'Business Hours' }));
	}
}

export class OmnichannelBusinessHours extends OmnichannelAdmin {
	readonly table: OmnichannelBusinessHoursTable;

	readonly listbox: Listbox;

	constructor(page: Page) {
		super(page);
		this.table = new OmnichannelBusinessHoursTable(page);
		this.listbox = new Listbox(page);
	}

	get btnCreateBusinessHour(): Locator {
		return this.page.locator('header').locator('role=button[name="New"]');
	}

	get btnSave(): Locator {
		return this.page.locator('role=button[name="Save"]');
	}

	get inputName(): Locator {
		return this.page.locator('[name="name"]');
	}

	get fieldDepartment(): Locator {
		return this.page.getByLabel('Departments', { exact: true });
	}

	get inputDepartments(): Locator {
		return this.fieldDepartment.getByRole('textbox');
	}

	async deleteBusinessHour(name: string) {
		await this.table.findRowByName(name).getByRole('button', { name: 'Remove' }).click();
		await this.deleteModal.confirmDelete();
	}

	getCheckboxByLabel(name: string): Locator {
		return this.page.locator('label', { has: this.page.getByRole('checkbox', { name }) });
	}

	findDepartmentsChipOption(name: string) {
		return this.fieldDepartment.getByRole('option', { name, exact: true });
	}

	async selectDepartment(name: string) {
		await this.inputDepartments.click();
		await this.inputDepartments.fill(name);
		await this.listbox.selectOption(name);
	}
}
