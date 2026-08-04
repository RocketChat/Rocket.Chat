import type { Locator, Page } from '@playwright/test';

import { Modal } from './modal';

export class OmnichannelDeleteContactModal extends Modal {
	constructor(page: Page) {
		super(page.getByRole('dialog', { name: 'Delete Contact' }));
	}

	get inputConfirmation(): Locator {
		return this.root.getByRole('textbox', { name: 'Confirm Contact Removal' });
	}

	get btnDelete(): Locator {
		return this.root.getByRole('button', { name: 'Delete' });
	}

	async delete() {
		await this.btnDelete.click();
		await this.waitForDismissal();
	}
}
