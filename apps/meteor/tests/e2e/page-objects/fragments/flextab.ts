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

	async close() {
		await this.btnClose.click();
		await this.waitForDismissal();
	}
}
