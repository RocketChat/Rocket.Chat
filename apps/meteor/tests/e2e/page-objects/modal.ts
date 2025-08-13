import type { Locator, Page } from '@playwright/test';

export class Modal {
	protected readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	getModalByName(name: string): Locator {
		return this.page.getByRole('dialog', { name });
	}

	get textInput(): Locator {
		return this.page.locator('[name="modal_input"]');
	}

	get textInputErrorMessage(): Locator {
		return this.page.getByText('Validation failed');
	}

	get btnModalSubmit(): Locator {
		return this.page.locator('role=button[name="Submit"]');
	}
}
