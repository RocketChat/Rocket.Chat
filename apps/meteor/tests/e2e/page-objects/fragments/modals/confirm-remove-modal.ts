import type { Locator } from 'playwright-core';

import { Modal } from './modal';

export class ConfirmRemoveModal extends Modal {
	constructor(root: Locator) {
		super(root);
	}

	get btnRemove() {
		return this.root.getByRole('button', { name: 'Remove' });
	}

	async confirmRemove() {
		await this.btnRemove.click();
		await this.waitForDismissal();
	}
}
