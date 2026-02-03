import type { Locator, Page } from 'playwright-core';

import { Modal } from './modal';

export class ConfirmDeleteModal extends Modal {
	constructor(root: Locator) {
		super(root);
	}

	get btnDelete() {
		return this.root.getByRole('button', { name: 'Delete' });
	}

	async confirmDelete() {
		await this.btnDelete.click();
		await this.waitForDismissal();
	}
}

export class ConfirmDeleteDepartmentModal extends ConfirmDeleteModal {
	constructor(page: Page) {
		super(page.getByRole('dialog', { name: 'Delete Department?' }));
	}

	get inputConfirmDepartmentName() {
		return this.root.getByRole('textbox', { name: 'Department name' });
	}

	async deleteDepartment(departmentName: string) {
		await this.inputConfirmDepartmentName.fill(departmentName);
		await this.confirmDelete();
	}
}
