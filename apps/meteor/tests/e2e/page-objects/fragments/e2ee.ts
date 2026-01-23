import type { Locator, Page } from '@playwright/test';

import { expect } from '../../utils/test';

abstract class E2EEBanner {
	constructor(protected root: Locator) {}

	click() {
		return this.root.click();
	}

	async waitForDisappearance() {
		await expect(this.root).not.toBeVisible();
	}
}

export class SaveE2EEPasswordBanner extends E2EEBanner {
	constructor(page: Page) {
		super(page.getByRole('button', { name: 'Save your new E2EE password' }));
	}
}

export class EnterE2EEPasswordBanner extends E2EEBanner {
	constructor(page: Page) {
		// TODO: there is a typo in the default translation
		super(page.getByRole('button', { name: 'Enter your E2E password' }));
	}
}

export class E2EEKeyDecodeFailureBanner extends E2EEBanner {
	constructor(page: Page) {
		super(page.getByRole('button', { name: "Wasn't possible to decode your encryption key to be imported." }));
	}

	async expectToNotBeVisible() {
		await expect(this.root).not.toBeVisible();
	}
}
