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
		return this.root.getByRole('button', { name: 'Close' });
	}

	get inputName() {
		return this.root.getByRole('textbox', { name: 'Name' });
	}

	get btnSave() {
		return this.root.getByRole('button', { name: 'Save' });
	}

	get btnCancel() {
		return this.root.getByRole('button', { name: 'Cancel' });
	}

	get btnDelete() {
		return this.root.locator('role=button[name="Delete"]');
	}

	get btnReset() {
		return this.root.getByRole('button', { name: 'Reset' });
	}

	async close() {
		await this.btnClose.click();
		await this.waitForDismissal();
	}
}
