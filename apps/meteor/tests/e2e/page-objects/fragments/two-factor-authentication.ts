import type { Locator, Page } from '@playwright/test';
import speakeasy from 'speakeasy';

import * as constants from '../../config/constants';
import { expect } from '../../utils/test';

export class TwoFactorAuthentication {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	get checkboxPrivateChannel(): Locator {
		return this.page.locator('#modal-root [data-qa="create-channel-modal"] [data-qa-type="channel-private-toggle"]');
	}

	totp(secret: string) {
		return speakeasy.totp({ secret, encoding: 'base32' });
	}

	async setTwoFactorAuthenticationRememberTime(time: number) {
		await this.page.goto('/admin/settings/Accounts');

		await this.page.locator('[data-qa-section="Two Factor Authentication"]').click();

		const value = await this.page.locator('#Accounts_TwoFactorAuthentication_RememberFor').inputValue();
		if (value === String(time)) return;

		await this.page.locator('#Accounts_TwoFactorAuthentication_RememberFor').fill(String(time));
		await this.page.locator('role=button[name="Save changes"]').click();

		const passwordAsked = await this.page.locator('role=dialog >> text="Please enter your password"').isVisible();
		if (passwordAsked) {
			await this.page.locator('input[type="password"]').type(constants.ADMIN_CREDENTIALS.password);
			await this.page.locator('role=button[name="Verify"]').click();
		}
		await expect(this.page.locator('.rcx-toastbar.rcx-toastbar--success')).toBeVisible();
	}

	async enterTwoFactorAuthenticationCode(secret: string): Promise<void> {
		const totpToken = this.totp(secret);
		await expect(this.page.locator('role=dialog >> text="Two Factor Authentication"')).toBeVisible();
		await this.page.locator('role=textbox[name="Enter authentication code"]').type(totpToken);
		await this.page.locator('role=button[name="Verify"]').click();
	}
}
