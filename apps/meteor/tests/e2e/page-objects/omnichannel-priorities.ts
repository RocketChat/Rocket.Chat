import type { Locator, Page } from '@playwright/test';

import { OmnichannelSidenav, ToastMessages } from './fragments';

class OmnichannelManagePriority {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	get inputName(): Locator {
		return this.page.locator('[name="name"]');
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

	// TODO: This will be inherited from a BasePage Object
	readonly toastMessage: ToastMessages;

	constructor(page: Page) {
		this.page = page;
		this.managePriority = new OmnichannelManagePriority(page);
		this.sidenav = new OmnichannelSidenav(page);
		this.toastMessage = new ToastMessages(page);
	}

	get btnReset() {
		return this.page.locator('role=button[name="Reset"]');
	}

	get btnResetConfirm() {
		return this.page.locator('.rcx-modal').locator('role=button[name="Reset"]');
	}

	findPriority(name: string) {
		return this.page.locator('tr', { has: this.page.locator(`td >> text="${name}"`) });
	}
}
