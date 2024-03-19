import { Users } from './fixtures/userStates';
import { AccountProfile } from './page-objects';
import { getSettingValueById } from './utils/getSettingValueById';
import { setSettingValueById } from './utils/setSettingValueById';
import { test, expect, BaseTestAPI } from './utils/test';

test.use({ storageState: Users.admin.state });

test.describe.serial('access-security-page', () => {
	let e2eEnabledDefaultValue: unknown;
	let twofaEnabledDefaultValue: unknown;
	let passwordChangeEnabledDefaultValue: unknown;
	let poAccountProfile: AccountProfile;
	let enableSettings: (api: BaseTestAPI, { passwordChange, twofa, e2e }: { passwordChange: boolean; twofa: boolean; e2e: boolean }) => Promise<void>;
	let isFirstTestOver = false;

	test.beforeAll(async ({ api }) => {
		[passwordChangeEnabledDefaultValue, twofaEnabledDefaultValue, e2eEnabledDefaultValue] = await Promise.all([
			getSettingValueById(api, 'Accounts_AllowPasswordChange'),
			getSettingValueById(api, 'Accounts_TwoFactorAuthentication_Enabled'),
			getSettingValueById(api, 'E2E_Enable'),
		]);

		enableSettings = async (api, { passwordChange, twofa, e2e }) => {
			await Promise.all([
				setSettingValueById(api, 'Accounts_AllowPasswordChange', passwordChange),
				setSettingValueById(api, 'Accounts_TwoFactorAuthentication_Enabled', twofa),
				setSettingValueById(api, 'E2E_Enable', e2e),
			]);
		}

		await enableSettings(api, { passwordChange: false, twofa: false, e2e: false });
	});

	test.beforeEach(async ({ page }) => {
		poAccountProfile = new AccountProfile(page);
		await page.goto('/account/security');
		await page.waitForLoadState('networkidle');
	});

	test.afterEach(async ({ api }) => {
		if (!isFirstTestOver) {
			// This has to be done before page is loaded, since the side nav is not reactive to the settings in real time
			await enableSettings(api, { passwordChange: true, twofa: false, e2e: false });
			isFirstTestOver = true;
		}
	});

	test.afterAll(async ({ api }) => {
		await Promise.all([
			setSettingValueById(api, 'Accounts_AllowPasswordChange', passwordChangeEnabledDefaultValue),
			setSettingValueById(api, 'Accounts_TwoFactorAuthentication_Enabled', twofaEnabledDefaultValue),
			setSettingValueById(api, 'E2E_Enable', e2eEnabledDefaultValue),
		]);
	});

	test('security tab is invisible when password change, 2FA and E2E are disabled', async ({ page }) => {
		const securityTab = poAccountProfile.sidenav.linkSecurity;
		await expect(securityTab).not.toBeVisible();
		const mainContent = page.locator('.main-content').getByText('You are not authorized to view this page.').first();
		await expect(mainContent).toBeVisible({ timeout: 10000 });
	});

	test('can access account security sections', async ({ api }) => {
		await test.step('security page is visible when password change is enabled but 2FA and E2E are disabled', async () => {
			await poAccountProfile.securityHeader.waitFor({ state: 'visible' });
			const securityTab = poAccountProfile.sidenav.linkSecurity;

			await expect(securityTab).toBeVisible();
		});

		await test.step('can access password change when enabled but 2FA and E2E are disabled', async () => {
			await expect(poAccountProfile.securityPasswordSection).toBeVisible();
		});

		await test.step('can access 2FA setting when enabled but password change and E2E are disabled', async () => {
			await enableSettings(api, { passwordChange: false, twofa: true, e2e: false });
			await expect(poAccountProfile.security2FASection).toBeVisible();
		});

		await test.step('can access E2E setting when enabled but password change and 2FA are disabled', async () => {
			await enableSettings(api, { passwordChange: false, twofa: false, e2e: true });
			await expect(poAccountProfile.securityE2EEncryptionSection).toBeVisible();
		});
	})
});
