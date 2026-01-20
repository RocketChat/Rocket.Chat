import type { Locator } from 'playwright-core';

import { Modal } from './modal';

export class ConfirmDeleteModal extends Modal {
	constructor(root: Locator) {
		super(root);
	}

	private btnDelete() {
		return this.root.getByRole('button', { name: 'Delete' });
	}

	async confirmDelete() {
		await this.btnDelete().click();
		await this.waitForDismissal();
	}
}
