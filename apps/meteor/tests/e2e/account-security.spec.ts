import { faker } from '@faker-js/faker';

import { ADMIN_CREDENTIALS } from './config/constants';
import { Users } from './fixtures/userStates';
import { AccountSecurity } from './page-objects';
import { setSettingValueById, updateOwnUserPassword } from './utils';
import { test, expect } from './utils/test';

test.use({ storageState: Users.admin.state });

const RANDOM_PASSWORD = faker.helpers
	.shuffle([
		faker.string.alpha({ casing: 'upper' }),
		faker.string.alpha({ casing: 'lower' }),
		faker.string.numeric(),
		faker.string.symbol(),
		faker.string.alphanumeric(10),
	])
	.join('');

test.describe.serial('account-security', () => {
	let poAccountSecurity: AccountSecurity;

	test.beforeEach(async ({ page, api }) => {
		poAccountSecurity = new AccountSecurity(page);
		await page.goto('/account/security');
		await page.waitForSelector('#main-content');
		await setSettingValueById(api, 'Accounts_Password_Policy_Enabled', false);
	});

	test.afterAll(async ({ api }) =>
		Promise.all([
			setSettingValueById(api, 'Accounts_AllowPasswordChange', true),
			setSettingValueById(api, 'Accounts_TwoFactorAuthentication_Enabled', true),
			setSettingValueById(api, 'E2E_Enable', false),
			setSettingValueById(api, 'Accounts_Password_Policy_Enabled', true),
		]),
	);

	test('should disable and enable email 2FA', async () => {
		await poAccountSecurity.security2FASection.click();
		await expect(poAccountSecurity.email2FASwitch).toBeVisible();
		await poAccountSecurity.email2FASwitch.click();
		await poAccountSecurity.toastMessage.waitForDisplay();
		await poAccountSecurity.toastMessage.dismissToast();

		await poAccountSecurity.email2FASwitch.click();
		await poAccountSecurity.toastMessage.waitForDisplay();
	});

	test('should be able to change password', async ({ api }) => {
		await test.step('change password', async () => {
			await poAccountSecurity.changePassword(RANDOM_PASSWORD, RANDOM_PASSWORD, ADMIN_CREDENTIALS.password);
			await expect(poAccountSecurity.inputNewPassword).toHaveValue('');
		});

		await test.step('change back to the original password', async () => {
			expect(
				(await updateOwnUserPassword(api, { newPassword: ADMIN_CREDENTIALS.password, currentPassword: RANDOM_PASSWORD })).status(),
			).toBe(200);
		});
	});

	test.describe('settings disabled', () => {
		test.beforeAll(async ({ api }) => {
			await Promise.all([
				setSettingValueById(api, 'Accounts_AllowPasswordChange', false),
				setSettingValueById(api, 'Accounts_TwoFactorAuthentication_Enabled', false),
				setSettingValueById(api, 'E2E_Enable', false),
			]);
		});

		test('security tab is invisible when password change, 2FA and E2E are disabled', async ({ page }) => {
			const securityTab = poAccountSecurity.sidebar.linkSecurity;
			await expect(securityTab).not.toBeVisible();
			const mainContent = page.locator('#main-content').getByText('You are not authorized to view this page.').first();
			await expect(mainContent).toBeVisible();
		});
	});

	test.describe('account security sections', () => {
		test.beforeAll(async ({ api }) => {
			await Promise.all([
				setSettingValueById(api, 'Accounts_AllowPasswordChange', true),
				setSettingValueById(api, 'Accounts_TwoFactorAuthentication_Enabled', false),
				setSettingValueById(api, 'E2E_Enable', false),
			]);
		});

		test.beforeEach(async () => {
			await poAccountSecurity.securityHeader.waitFor({ state: 'visible' });
		});

		test('should display security tab and section when password change is enabled but 2FA and E2E are disabled', async () => {
			await expect(poAccountSecurity.sidebar.linkSecurity).toBeVisible();
			await expect(poAccountSecurity.securityPasswordSection).toBeVisible();
		});

		test('can access 2FA setting when enabled but password change and E2E are disabled', async ({ api }) => {
			await Promise.all([
				setSettingValueById(api, 'Accounts_AllowPasswordChange', false),
				setSettingValueById(api, 'Accounts_TwoFactorAuthentication_Enabled', true),
				setSettingValueById(api, 'E2E_Enable', false),
			]);
			await expect(poAccountSecurity.security2FASection).toBeVisible();
		});

		test('can access E2E setting when enabled but password change and 2FA are disabled', async ({ api }) => {
			await Promise.all([
				setSettingValueById(api, 'Accounts_AllowPasswordChange', false),
				setSettingValueById(api, 'Accounts_TwoFactorAuthentication_Enabled', false),
				setSettingValueById(api, 'E2E_Enable', true),
			]);
			await expect(poAccountSecurity.securityE2EEncryptionSection).toBeVisible();
		});
	});
});
