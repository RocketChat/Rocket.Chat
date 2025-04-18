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

	get clickFilters(): Locator {
		return this.page.getByText('Filters');
	}

	get closeChip(): Locator {
		return this.page.locator('button.rcx-chip i');
	}

	get inputServedBy(): Locator {
		return this.page.locator('[data-qa="autocomplete-multiple-agent"] div input');
	}

	get inputDepartment(): Locator {
		return this.page.locator('//*[label="Department"]//input');
	}

	get clickApply(): Locator {
		return this.page.getByRole('button', { name: 'Apply' });
	}

	get clickChats(): Locator {
		return this.page.getByRole('tab', { name: 'Chats' });
	}

	get inputStatus(): Locator {
		return this.page.getByTestId('hidden-select-container');
	}

	get inputTags(): Locator {
		return this.page.getByRole('listbox').nth(2);
	}

	get inputFromDate(): Locator {
		return this.page.locator('[type="date"] [placeholder="From"]');
	}

	get clearFilters(): Locator {
		return this.page.getByRole('button', { name: 'Clear filters' });
	}

	get close(): Locator {
		return this.page.locator('[data-qa="ContextualbarActionClose"]');
	}

	get servedByChip(): Locator {
		return this.page.getByRole('button', { name: 'Served By:' });
	}

	get statusChip(): Locator {
		return this.page.getByRole('button', { name: 'Status:' });
	}

	get departmentChip(): Locator {
		return this.page.getByRole('button', { name: 'Department:' });
	}

	get searchChip(): Locator {
		return this.page.getByRole('button', { name: 'Text:' });
	}

	async selectServedBy(option: string) {
		await this.inputServedBy.click();
		await this.inputServedBy.fill(option);
		await this.page.locator(`[role='option'][value='${option}']`).click();
		await this.page.getByRole('button', { name: 'Apply' }).click();
	}

	async selectStatus(option: string) {
		await this.inputStatus.click();
		await this.page.locator(`[role='option'][data-key='${option}']`).click();
		await this.page.getByRole('button', { name: 'Apply' }).click();
	}

	async selectDepartment(option: string) {
		await this.inputDepartment.click();
		await this.inputDepartment.fill(option);
		await this.page.locator(`role=option[name='${option}']`).click();
		await this.inputDepartment.click();
		await this.page.getByRole('button', { name: 'Apply' }).click();
	}

	async addTag(option: string) {
		await this.inputTags.click();
		await this.page.locator(`[role='option'][value='${option}']`).click();
		await this.inputTags.click();
		await this.page.getByRole('button', { name: 'Apply' }).click();
	}

	async removeTag(option: string) {
		await this.page.locator(`role=option[name='${option}']`).click();
		await this.page.getByRole('button', { name: 'Apply' }).click();
	}
}
