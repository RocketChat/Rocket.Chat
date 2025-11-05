import type { Locator } from '@playwright/test';

import { expect } from '../../utils/test';

export abstract class Modal {
	constructor(protected root: Locator) {}

	waitForDisplay() {
		return expect(this.root).toBeVisible();
	}

	waitForDismissal() {
		return expect(this.root).not.toBeVisible();
	}

	private get btnClose() {
		return this.root.getByRole('button', { name: 'Close' });
	}

	async close() {
		await this.btnClose.click();
		await this.waitForDismissal();
	}

	private get btnSave() {
		return this.root.getByRole('button', { name: 'Save' });
	}

	async save() {
		await this.btnSave.click();
		await this.waitForDismissal();
	}
}

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
