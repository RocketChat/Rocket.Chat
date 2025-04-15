import { Users } from './fixtures/userStates';
import { AccountProfile } from './page-objects';
import { test, expect } from './utils/test';

test.use({ storageState: Users.admin.state });

test.describe.serial('access-security-page', () => {
	let poAccountProfile: AccountProfile;

	test.beforeAll(async ({ updateSetting }) => {
		await Promise.all([
			updateSetting('Accounts_AllowPasswordChange', false, true),
			updateSetting('Accounts_TwoFactorAuthentication_Enabled', false, true),
			updateSetting('E2E_Enable', false, false),
		]);
	});

	test.beforeEach(async ({ page }) => {
		poAccountProfile = new AccountProfile(page);
		await page.goto('/account/security');
		await page.waitForSelector('.main-content');
	});

	test.afterAll(async ({ restoreSettings }) => {
		await restoreSettings();
	});

	test('security tab is invisible when password change, 2FA and E2E are disabled', async ({ page }) => {
		const securityTab = poAccountProfile.sidenav.linkSecurity;
		await expect(securityTab).not.toBeVisible();
		const mainContent = page.locator('.main-content').getByText('You are not authorized to view this page.').first();
		await expect(mainContent).toBeVisible();
	});

	test.describe.serial('can access account security sections', () => {
		test.beforeAll(async ({ updateSetting }) => {
			await Promise.all([
				updateSetting('Accounts_AllowPasswordChange', true),
				updateSetting('Accounts_TwoFactorAuthentication_Enabled', false),
				updateSetting('E2E_Enable', false),
			]);
		});

		test.beforeEach(async () => {
			await poAccountProfile.securityHeader.waitFor({ state: 'visible' });
		});

		test('security page is visible when password change is enabled but 2FA and E2E are disabled', async () => {
			const securityTab = poAccountProfile.sidenav.linkSecurity;

			await expect(securityTab).toBeVisible();
		});

		test('can access password change when enabled but 2FA and E2E are disabled', async () => {
			await expect(poAccountProfile.securityPasswordSection).toBeVisible();
		});

		test('can access 2FA setting when enabled but password change and E2E are disabled', async ({ updateSetting }) => {
			await Promise.all([
				updateSetting('Accounts_AllowPasswordChange', false),
				updateSetting('Accounts_TwoFactorAuthentication_Enabled', true),
				updateSetting('E2E_Enable', false),
			]);

			await expect(poAccountProfile.security2FASection).toBeVisible();
		});

		test('can access E2E setting when enabled but password change and 2FA are disabled', async ({ updateSetting }) => {
			await Promise.all([
				updateSetting('Accounts_AllowPasswordChange', false),
				updateSetting('Accounts_TwoFactorAuthentication_Enabled', false),
				updateSetting('E2E_Enable', true),
			]);

			await expect(poAccountProfile.securityE2EEncryptionSection).toBeVisible();
		});
	});
});
