import type { Locator } from '@playwright/test';

import { expect } from '../../utils/test';

export abstract class FlexTab {
	constructor(public root: Locator) {}

	waitForDisplay() {
		return expect(this.root).toBeVisible();
	}

	waitForDismissal() {
		return expect(this.root).not.toBeVisible();
	}

	private get btnClose() {
		return this.root.getByRole('button', { name: 'Close', exact: true });
	}

	get inputName() {
		return this.root.getByRole('textbox', { name: 'Name', exact: true });
	}

	get btnSave() {
		return this.root.getByRole('button', { name: 'Save', exact: true });
	}

	get btnCancel() {
		return this.root.getByRole('button', { name: 'Cancel', exact: true });
	}

	get btnDelete() {
		return this.root.getByRole('button', { name: 'Delete', exact: true });
	}

	get btnReset() {
		return this.root.getByRole('button', { name: 'Reset', exact: true });
	}

	async close() {
		await this.btnClose.click();
		await this.waitForDismissal();
	}

	async save() {
		await this.btnSave.click();
		await this.waitForDismissal();
	}
}
