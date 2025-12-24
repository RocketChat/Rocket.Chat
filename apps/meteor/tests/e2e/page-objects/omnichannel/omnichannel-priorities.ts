import type { Locator, Page } from '@playwright/test';

import { OmnichannelAdmin } from './omnichannel-admin';
import { Modal } from '../fragments/modal';

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

export class OmnichannelResetPrioritiesModal extends Modal {
	constructor(page: Page) {
		super(page.getByRole('dialog', { name: 'Reset priorities' }));
	}

	private get btnResetConfirm() {
		return this.root.getByRole('button', { name: 'Reset' });
	}

	async reset() {
		await this.btnResetConfirm.click();
		await this.waitForDismissal();
	}
}

export class OmnichannelPriorities extends OmnichannelAdmin {
	readonly managePriority: OmnichannelManagePriority;

	constructor(page: Page) {
		super(page);
		this.managePriority = new OmnichannelManagePriority(page);
	}

	get btnReset() {
		return this.page.locator('role=button[name="Reset"]');
	}

	findPriority(name: string) {
		return this.page.getByRole('link', { name, exact: true });
	}
}
