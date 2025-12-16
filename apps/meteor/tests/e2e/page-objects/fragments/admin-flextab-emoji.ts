import type { Locator, Page } from '@playwright/test';

import { FlexTab } from './flextab';

export class AdminFlextabEmoji extends FlexTab {
	constructor(page: Page) {
		super(page.getByRole('dialog', { name: 'Add New Emoji' }));
	}

	async save() {
		await this.root.getByRole('button', { name: 'Save' }).click();
		// When clicking save, the contextual bar closes with a redirect
		// But this redirect can interfere with other actions, so we need to ensure it happens first.
		await this.waitForDismissal();
	}

	async delete() {
		await this.root.getByRole('button', { name: 'Delete' }).click();
		await this.waitForDismissal();
	}

	get inputName(): Locator {
		return this.root.getByRole('textbox', { name: 'Name' });
	}
}
