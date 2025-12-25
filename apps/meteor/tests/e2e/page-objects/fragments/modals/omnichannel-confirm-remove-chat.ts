import type { Locator, Page } from 'playwright-core';

import { Modal } from './modal';

export class OmnichannelConfirmRemoveChat extends Modal {
	constructor(page: Page) {
		super(page.getByRole('dialog'));
	}

	private get btnConfirmRemove(): Locator {
		return this.root.getByRole('button', { name: 'Delete' });
	}

	async confirm() {
		await this.btnConfirmRemove.click();
		await this.waitForDismissal();
	}
}
