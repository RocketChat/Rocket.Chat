import type { Page } from '@playwright/test';

import { Modal } from './modal';

export class ManageCategoryModal extends Modal {
	constructor(page: Page) {
		super(page.getByRole('dialog', { name: 'Manage category', exact: true }), page);
	}

	private get inputName() {
		return this.root.getByRole('textbox', { name: 'Name', exact: true });
	}

	async rename(newName: string): Promise<void> {
		await this.inputName.fill(newName);
		await this.save();
	}
}
