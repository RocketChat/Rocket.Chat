import type { Page } from '@playwright/test';

import { Modal } from './modal';

export class DeleteCategoryModal extends Modal {
	constructor(page: Page) {
		super(page.getByRole('dialog', { name: 'Delete category', exact: true }), page);
	}

	private get btnDelete() {
		return this.root.getByRole('button', { name: 'Delete', exact: true });
	}

	async delete() {
		await this.btnDelete.click();
		await this.waitForDismissal();
	}
}
