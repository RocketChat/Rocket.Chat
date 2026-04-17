import type { Locator, Page } from '@playwright/test';

import { expect } from '../../utils/test';

abstract class E2EEBanner {
	constructor(protected root: Locator) {}

	private async dismissBlockingModal(): Promise<void> {
		const modalBackdrop = this.root.page().locator('#modal-root .rcx-modal__backdrop:visible').first();
		if (!(await modalBackdrop.isVisible().catch(() => false))) {
			return;
		}

		await this.root
			.page()
			.keyboard.press('Escape')
			.catch(() => undefined);
		await modalBackdrop.waitFor({ state: 'hidden', timeout: 3_000 }).catch(() => undefined);
	}

	async click() {
		await this.dismissBlockingModal();
		await expect(this.root).toBeVisible({ timeout: 15_000 });

		try {
			await this.root.click({ timeout: 3_000 });
		} catch {
			await this.dismissBlockingModal();
			await this.root.click({ force: true });
		}
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
