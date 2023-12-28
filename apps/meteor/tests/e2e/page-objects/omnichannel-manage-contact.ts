import type { Locator, Page } from '@playwright/test';

export class OmnichannelManageContact {
	protected readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	get newContactTitle(): Locator {
		return this.page.locator('h3 >> text="New contact"');
	}

	get editContactTitle(): Locator {
		return this.page.locator('h3 >> text="Edit Contact Profile"');
	}

	get inputName(): Locator {
		return this.page.locator('input[name=name]');
	}

	get inputEmail(): Locator {
		return this.page.locator('input[name=email]');
	}

	get inputPhone(): Locator {
		return this.page.locator('input[name=phone]');
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

	errorMessage(message: string): Locator {
		return this.page.locator(`.rcx-field__error >> text="${message}"`);
	}
}
