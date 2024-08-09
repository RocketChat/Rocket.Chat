import { faker } from '@faker-js/faker';
import type { Page } from '@playwright/test';

import { test, expect } from './utils/test';
import { AccountProfile, HomeChannel } from './page-objects';
import { TwoFactorAuthentication } from './page-objects/fragments/two-factor-authentication';
import * as constants from './config/constants';

test.describe.serial('two-factor-authentication', () => {
	test.use({ storageState: 'admin-session.json' });

	let poAccountProfile: AccountProfile;
	let poTwoFactorAuthentication: TwoFactorAuthentication;
	let poHomeChannel: HomeChannel;
	let secret: string;

	async function login(page: Page): Promise<void> {
		await page.locator('[name=username]').type(constants.ADMIN_CREDENTIALS.email);
		await page.locator('[name=password]').type(constants.ADMIN_CREDENTIALS.password);
		await page.locator('role=button >> text="Login"').click();

		await poTwoFactorAuthentication.enterTwoFactorAuthenticationCode(secret);
		await page.waitForTimeout(1000);
		await page.context().storageState({ path: `admin-session.json` });
	}

	test.beforeAll(async ({ api }) => {
		const response = await (await api.get('/settings/Accounts_TwoFactorAuthentication_Enabled')).json();
		if (response.value === false) {
			const statusCode = (await api.post('/settings/Accounts_TwoFactorAuthentication_Enabled', { value: true })).status();
			expect(statusCode).toBe(200);
		}
	});

	test.beforeEach(async ({ page }) => {
		poAccountProfile = new AccountProfile(page);
		poTwoFactorAuthentication = new TwoFactorAuthentication(page);
		poHomeChannel = new HomeChannel(page);
	});

	test('Enable two-factor authentication', async ({ page }) => {
		await poTwoFactorAuthentication.setTwoFactorAuthenticationRememberTime(0);

		await page.goto('/account/security');
		await page.locator('role=button[name="Enable two-factor authentication via TOTP"]').click();

		secret = (await page.locator('[data-qa="totp-secret"] >> div').textContent()) || '';
		console.log({ secret });

		const token = poTwoFactorAuthentication.totp(secret);
		await page.locator('role=textbox[name="Enter authentication code"]').type(token);
		await page.locator('role=button[name="Verify"]').click();

		await page.goto('/home');
		await poHomeChannel.sidenav.logout();
		await login(page);
	});

	test('Create and delete personal token with 2FA', async ({ page }) => {
		await page.goto('/account/tokens');

		const tokenName = faker.random.alpha(10);

		await test.step('expect show new personal token', async () => {
			await poAccountProfile.inputToken.type(tokenName);
			await poAccountProfile.btnTokensAdd.click();

			await poTwoFactorAuthentication.enterTwoFactorAuthenticationCode(secret);

			await expect(poAccountProfile.tokenAddedModal).toBeVisible();
			await page.locator('role=button[name="Ok"]').click();
		});

		await test.step('expect delete personal token', async () => {
			await poAccountProfile.tokenInTable(tokenName).locator('button >> nth=1').click();
			await poAccountProfile.btnRemoveTokenModal.click();

			await poTwoFactorAuthentication.enterTwoFactorAuthenticationCode(secret);

			await expect(page.locator('.rcx-toastbar.rcx-toastbar--success')).toBeVisible();
		});
	});

	test('Disable two-factor authentication', async ({ page }) => {
		await page.goto('/account/security');
		await page.locator('role=button[name="Disable two-factor authentication via TOTP"]').click();

		await poTwoFactorAuthentication.enterTwoFactorAuthenticationCode(secret);
	});
});
