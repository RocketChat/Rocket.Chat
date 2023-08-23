import type { Locator, Page } from '@playwright/test';

import { OmnichannelSidenav } from './fragments';

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

	get btnClose() {
		return this.page.locator('button.rcx-button >> text="Close"');
	}

	get btnCancel() {
		return this.page.locator('button.rcx-button >> text="Cancel"');
	}

	get btnSave() {
		return this.page.locator('button.rcx-button >> text="Save"');
	}

	errorMessage(message: string): Locator {
		return this.page.locator(`.rcx-field__error >> text="${message}"`);
	}
}

export class OmnichannelSlaPolicies {
	private readonly page: Page;

	readonly manageSlaPolicy: OmnichannelManageSlaPolicy;

	readonly sidenav: OmnichannelSidenav;

	constructor(page: Page) {
		this.page = page;
		this.manageSlaPolicy = new OmnichannelManageSlaPolicy(page);
		this.sidenav = new OmnichannelSidenav(page);
	}

	findRowByName(name: string) {
		return this.page.locator('tr', { has: this.page.locator(`td >> text="${name}"`) });
	}

	btnRemove(name: string) {
		return this.findRowByName(name).locator('button[title="Remove"]');
	}

	get inputSearch() {
		return this.page.locator('[placeholder="Search"]');
	}

	get btnNew() {
		return this.page.locator('button.rcx-button >> text="Create SLA policy"');
	}

	get btnDelete() {
		return this.page.locator('button.rcx-button >> text="Delete"');
	}

	get txtDeleteModalTitle() {
		return this.page.locator('div.rcx-modal__title >> text="Are you sure?"');
	}

	get txtEmptyState() {
		return this.page.locator('div >> text="No results found"');
	}
}
