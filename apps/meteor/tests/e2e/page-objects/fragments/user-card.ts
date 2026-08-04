import type { Locator, Page } from '@playwright/test';

import { expect } from '../../utils/test';

export class UserCard {
	readonly root: Locator;

	constructor(protected page: Page) {
		this.root = page.getByRole('dialog', { name: 'User card', exact: true });
	}

	waitForDisplay() {
		return expect(this.root).toBeVisible();
	}

	waitForDismissal() {
		return expect(this.root).not.toBeVisible();
	}

	get btnSeeFullProfile(): Locator {
		return this.root.getByRole('button', { name: 'See full profile', exact: true });
	}

	get imgUserCard(): Locator {
		return this.root.locator('img');
	}

	async openUserInfo() {
		await this.btnSeeFullProfile.click();
	}
}
