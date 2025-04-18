import type { Locator } from '@playwright/test';

import { OmnichannelAdministration } from './omnichannel-administration';

export class OmnichannelBusinessHours extends OmnichannelAdministration {
	get btnCreateBusinessHour(): Locator {
		return this.page.locator('header').locator('role=button[name="New"]');
	}

	get btnSave(): Locator {
		return this.page.locator('role=button[name="Save"]');
	}

	get btnCancel(): Locator {
		return this.page.locator('role=button[name="Cancel"]');
	}

	get btnBack(): Locator {
		return this.page.locator('role=button[name="Back"]');
	}

	get inputSearch(): Locator {
		return this.page.getByRole('main').getByRole('textbox', { name: 'Search' });
	}

	get inputName(): Locator {
		return this.page.locator('[name="name"]');
	}

	get inputDepartments(): Locator {
		return this.page.locator('input[placeholder="Select an option"]');
	}

	findRowByName(name: string): Locator {
		return this.page.locator(`tr:has-text("${name}")`);
	}

	btnDeleteByName(name: string): Locator {
		return this.page.locator(`tr:has-text("${name}") button[title="Remove"]`);
	}

	get confirmDeleteModal(): Locator {
		return this.page.locator('dialog:has(h2:has-text("Are you sure?"))');
	}

	get btnCancelDeleteModal(): Locator {
		return this.confirmDeleteModal.locator('role=button[name="Cancel"]');
	}

	get btnConfirmDeleteModal(): Locator {
		return this.confirmDeleteModal.locator('role=button[name="Delete"]');
	}

	getCheckboxByLabel(name: string): Locator {
		return this.page.locator('label', { has: this.page.getByRole('checkbox', { name }) });
	}

	private selectOption(name: string): Locator {
		return this.page.locator(`[role=option][value="${name}"]`);
	}

	async selectDepartment({ name, _id }: { name: string; _id: string }) {
		await this.inputDepartments.click();
		await this.inputDepartments.fill(name);
		await this.selectOption(_id).click();
	}

	async search(text: string) {
		await this.inputSearch.fill(text);
	}
}
