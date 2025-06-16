import type { Locator, Page } from '@playwright/test';

export class OmnichannelManageContact {
	protected readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	get inputName(): Locator {
		return this.page.locator('input[name=name]');
	}

	get inputEmail(): Locator {
		return this.page.locator('input[name="emails.0.address"]');
	}

	get inputPhone(): Locator {
		return this.page.locator('input[name="phones.0.phoneNumber"]');
	}

	get inputContactManager(): Locator {
		return this.page.locator('input[name=contactManager]');
	}

	get btnSave(): Locator {
		return this.page.locator('button >> text="Save"');
	}

	get btnCancel(): Locator {
		return this.page.locator('button >> text="Cancel"');
	}

	get btnAddEmail(): Locator {
		return this.page.locator('role=button[name="Add email"]');
	}

	get btnAddPhone(): Locator {
		return this.page.locator('role=button[name="Add phone"]');
	}

	getErrorMessage(message: string): Locator {
		return this.page.locator(`role=alert >> text="${message}"`);
	}
}
