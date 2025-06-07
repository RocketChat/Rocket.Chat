import type { Locator, Page } from '@playwright/test';

import { OmnichannelContactInfo } from './omnichannel-info';
import { OmnichannelManageContact } from './omnichannel-manage-contact';

export class OmnichannelContacts {
	private readonly page: Page;

	readonly newContact: OmnichannelManageContact;

	readonly contactInfo: OmnichannelContactInfo;

	constructor(page: Page) {
		this.page = page;
		this.newContact = new OmnichannelManageContact(page);
		this.contactInfo = new OmnichannelContactInfo(page);
	}

	get btnNewContact(): Locator {
		return this.page.locator('button >> text="New contact"');
	}

	get inputSearch(): Locator {
		return this.page.locator('input[placeholder="Search"]');
	}

	findRowByName(contactName: string) {
		return this.page.locator(`td >> text="${contactName}"`);
	}

	get btnFilters(): Locator {
		return this.page.getByRole('button', { name: 'Filters' });
		return this.page.getByRole('button', { name: 'Filters' });
	}

	get btnCloseChip(): Locator {
		return this.page.locator('button.rcx-chip i');
	}

	get inputServedBy(): Locator {
		return this.filtersContextualBar.getByLabel('Served By').locator('input');
	}

	get inputDepartment(): Locator {
		return this.page.locator('//*[label="Department"]//input');
	}

	get btnApply(): Locator {
		return this.page.getByRole('button', { name: 'Apply' });
	}

	get tabChats(): Locator {
		return this.page.getByRole('tab', { name: 'Chats' });
	}

	get selectStatusContainer(): Locator {
		return this.page.getByTestId('hidden-select-container');
	}

	get inputTags(): Locator {
		// return this.page.getByRole('listbox').nth(2);
		return this.page.getByText('Tags').locator('input');
	}

	get inputUnits(): Locator {
		return this.filtersContextualBar.getByLabel('Units').locator('input');
	}

	get btnClearFilters(): Locator {
		return this.page.getByRole('button', { name: 'Clear filters' });
	}

	get filtersContextualBar(): Locator {
		return this.page.getByRole('dialog', { name: 'Filters' });
	}

	get btnClose(): Locator {
		return this.filtersContextualBar.getByRole('button', { name: 'Close' });
	}

	btnStatusChip(name: string): Locator {
		return this.page.getByRole('button', { name: `Status: ${name}` });
	}

	btnServedByChip(name: string): Locator {
		return this.page.getByRole('button', { name: `Served by: ${name}` });
	}

	btnDepartmentChip(name: string): Locator {
		return this.page.getByRole('button', { name: `Department: ${name}` });
	}

	btnSearchChip(name: string): Locator {
		return this.page.getByRole('button', { name: `Text: ${name}` });
	}

	btnUnitsChip(name: string): Locator {
		return this.page.getByRole('button', { name: `Units: ${name}` });
	}

	async selectServedBy(option: string) {
		await this.inputServedBy.click();
		await this.inputServedBy.fill(option);
		await this.page.locator(`[role='option'][value='${option}']`).click();
		await this.btnApply.click();
	}

	async selectStatus(option: string) {
		await this.selectStatusContainer.click();
		await this.page.locator(`[role='option'][data-key='${option}']`).click();
		await this.btnApply.click();
	}

	async selectDepartment(option: string) {
		await this.inputDepartment.click();
		await this.inputDepartment.fill(option);
		await this.page.locator(`role=option[name='${option}']`).click();
		await this.inputDepartment.click();
		await this.btnApply.click();
	}

	async addTag(option: string) {
		await this.inputTags.click();
		await this.inputTags.fill(option);
		await this.page.locator(`[role='option'][value='${option}']`).click();
		await this.inputTags.click();
		await this.btnApply.click();
	}

	async removeTag(option: string) {
		await this.page.locator(`role=option[name='${option}']`).click();
		await this.btnApply.click();
	}

	async selectUnit1(option: string) {
		await this.inputUnits.click();
		await this.page.locator(`[role='option'][value='${option}']`).click();
		await this.inputUnits.click();
		await this.btnApply.click();
	}

	findOption(optionText: string) {
		return this.page.locator(`role=option[name="${optionText}"]`);
	}

	async selectUnit(unitName: string) {
		await this.inputUnits.click();
		await this.inputUnits.fill(unitName);
		await this.findOption(unitName).click();
		await this.btnApply.click();
	}
}
