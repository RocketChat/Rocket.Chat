import type { Locator, Page } from '@playwright/test';

import { expect } from '../../utils/test';

export class AdminFlextabEmoji {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	async save() {
		await this.contextualBar.getByRole('button', { name: 'Save' }).click();
		// When clicking save, the contextual bar closes with a redirect
		// But this redirect can interfere with other actions, so we need to ensure it happens first.
		await expect(this.contextualBar).not.toBeVisible();
	}

	async delete() {
		await this.contextualBar.getByRole('button', { name: 'Delete' }).click();
		await expect(this.contextualBar).not.toBeVisible();
	}

	get contextualBar(): Locator {
		return this.page.getByRole('dialog', { name: 'Add New Emoji' });
	}

	get inputName(): Locator {
		return this.contextualBar.getByRole('textbox', { name: 'Name' });
	}
}
