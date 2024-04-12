import type { Locator, Page } from '@playwright/test';

import { OmnichannelSidenav } from './fragments';

class OmnichannelManagePriority {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	get inputName(): Locator {
		return this.page.locator('[name="name"]');
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

	get btnReset() {
		return this.page.locator('.rcx-vertical-bar').locator('role=button[name="Reset"]');
	}

	errorMessage(message: string): Locator {
		return this.page.locator(`.rcx-field__error >> text="${message}"`);
	}
}

export class OmnichannelPriorities {
	private readonly page: Page;

	readonly managePriority: OmnichannelManagePriority;

	readonly sidenav: OmnichannelSidenav;

	constructor(page: Page) {
		this.page = page;
		this.managePriority = new OmnichannelManagePriority(page);
		this.sidenav = new OmnichannelSidenav(page);
	}

	get toastSuccess(): Locator {
		return this.page.locator('.rcx-toastbar.rcx-toastbar--success');
	}

	get btnReset() {
		return this.page.locator('role=button[name="Reset"]');
	}

	get btnResetConfirm() {
		return this.page.locator('.rcx-modal').locator('role=button[name="Reset"]');
	}

	get btnCloseToastSuccess(): Locator {
		return this.toastSuccess.locator('button');
	}

	findPriority(name: string) {
		return this.page.locator('tr', { has: this.page.locator(`td >> text="${name}"`) });
	}
}
