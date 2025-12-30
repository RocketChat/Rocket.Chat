import type { Locator, Page } from '@playwright/test';

import { OmnichannelAdmin } from './omnichannel-admin';

class OmnichannelManageSlaPolicy {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	get inputName(): Locator {
		return this.page.locator('[name="name"]');
	}

	get inputDescription(): Locator {
		return this.page.locator('[name="description"]');
	}

	get inputEstimatedWaitTime(): Locator {
		return this.page.locator('[name="dueTimeInMinutes"]');
	}

	get btnSave() {
		return this.page.locator('button.rcx-button >> text="Save"');
	}

	errorMessage(message: string): Locator {
		return this.page.locator(`.rcx-field__error >> text="${message}"`);
	}
}

export class OmnichannelSlaPolicies extends OmnichannelAdmin {
	readonly manageSlaPolicy: OmnichannelManageSlaPolicy;

	constructor(page: Page) {
		super(page);
		this.manageSlaPolicy = new OmnichannelManageSlaPolicy(page);
	}

	findRowByName(name: string) {
		return this.page.locator('tr', { has: this.page.locator(`td >> text="${name}"`) });
	}

	btnRemove(name: string) {
		return this.findRowByName(name).locator('button[title="Remove"]');
	}

	async removeSLA(name: string) {
		await this.btnRemove(name).click();
		await this.deleteModal.confirmDelete();
	}

	btnCreateSlaPolicy(name: string) {
		return this.createByName(name);
	}

	get txtEmptyState() {
		return this.page.locator('div >> text="No results found"');
	}
}
