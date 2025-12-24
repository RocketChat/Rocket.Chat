import type { Locator, Page } from '@playwright/test';

import { OmnichannelAdmin } from './omnichannel-admin';

export class OmnichannelAgents extends OmnichannelAdmin {
	readonly editCtxBar: Locator;

	readonly infoCtxBar: Locator;

	constructor(page: Page) {
		super(page);
		this.editCtxBar = page.getByRole('dialog', { name: 'Edit User' });
		this.infoCtxBar = page.getByRole('dialog', { name: 'User Info' });
	}

	get inputUsername(): Locator {
		return this.page.locator('[data-qa-id="UserAutoComplete"]');
	}

	get btnAdd(): Locator {
		return this.page.locator('role=button[name="Add agent"]');
	}

	get firstRowInTable() {
		return this.page.locator('[data-qa-id="agents-table"] tr:first-child td:first-child');
	}

	async deleteAgent(name: string) {
		await this.search(name);
		await this.firstRowInTable.getByRole('button', { name: 'Remove' }).click();
		await this.deleteModal.confirmDelete();
	}

	get btnEdit(): Locator {
		return this.infoCtxBar.locator('[data-qa="agent-info-action-edit"]');
	}

	get btnRemove(): Locator {
		return this.infoCtxBar.locator('role=button[name="Remove"]');
	}

	get btnClose(): Locator {
		return this.editCtxBar.getByRole('button', { name: 'Close', exact: true });
	}

	get btnSave(): Locator {
		return this.editCtxBar.locator('[data-qa-id="agent-edit-save"]');
	}

	get inputMaxChats(): Locator {
		return this.editCtxBar.locator('input[name="maxNumberSimultaneousChat"]');
	}

	get inputStatus(): Locator {
		return this.page.locator('[data-qa-id="agent-edit-status"]');
	}

	get inputDepartment(): Locator {
		return this.editCtxBar.getByLabel('Departments').getByRole('textbox');
	}

	get scrollContainer(): Locator {
		return this.page.locator('#position-container').getByTestId('virtuoso-scroller');
	}

	findOption(name: string) {
		return this.page.locator('#position-container').getByRole('option', { name, exact: true });
	}

	scrollToListBottom() {
		return this.scrollContainer.evaluate((el) => {
			el.scrollTop = el.scrollHeight;
			el.dispatchEvent(new Event('scroll'));
		});
	}

	async selectDepartment(name: string) {
		await this.inputDepartment.click();
		await this.inputDepartment.fill(name);
		await this.findOption(name).click();
		// TODO: This is necessary due to the PaginatedMultiSelectFiltered not closing the list when an option is selected nor when close is clicked.
		// The line below can be removed once the component is adjusted in Fuselage
		await this.editCtxBar.click();
	}

	async selectStatus(status: string) {
		await this.inputStatus.click();
		await this.page.locator(`.rcx-option__content:has-text("${status}")`).click();
	}

	async selectUsername(username: string) {
		await this.inputUsername.fill(username);
		await this.page.locator(`role=option[name="${username}"]`).click();
	}

	findRowByUsername(username: string) {
		return this.page.locator(`[data-qa-id="${username}"]`);
	}

	findRowByName(name: string) {
		return this.page.locator('tr', { has: this.page.locator(`td >> text="${name}"`) });
	}

	findSelectedDepartment(name: string) {
		return this.editCtxBar.getByLabel('Departments', { exact: true }).getByRole('option', { name });
	}
}
