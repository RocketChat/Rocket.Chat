import { Users } from './fixtures/userStates';
import { AccountSecurityPage } from './page-objects/account/security';
import { setSettingValueById } from './utils/setSettingValueById';
import { test, expect } from './utils/test';

test.use({ storageState: Users.admin.state });

test.describe.serial('access-security-page', () => {
	test.beforeAll(async ({ api }) => {
		await Promise.all([
			setSettingValueById(api, 'Accounts_AllowPasswordChange', false),
			setSettingValueById(api, 'Accounts_TwoFactorAuthentication_Enabled', false),
			setSettingValueById(api, 'E2E_Enable', false),
		]);
	});

	test.afterAll(async ({ api }) =>
		Promise.all([
			setSettingValueById(api, 'Accounts_AllowPasswordChange', true),
			setSettingValueById(api, 'Accounts_TwoFactorAuthentication_Enabled', true),
			setSettingValueById(api, 'E2E_Enable', false),
		]),
	);

	let accountSecurityPage: AccountSecurityPage;

	test.beforeEach(async ({ page }) => {
		accountSecurityPage = new AccountSecurityPage(page);

		await accountSecurityPage.goto();
	});

	test('security tab is invisible when password change, 2FA and E2E are disabled', async () => {
		await expect(accountSecurityPage.sidenav.securityLink).not.toBeVisible();
		await expect(accountSecurityPage.unathorizedToViewPageMessage).toBeVisible();
	});

	test('should not have any accessibility violations', async ({ makeAxeBuilder }) => {
		const results = await makeAxeBuilder().analyze();
		expect(results.violations).toEqual([]);
	});

	test.describe.serial('can access account security sections', () => {
		test.beforeAll(async ({ api }) => {
			await Promise.all([
				setSettingValueById(api, 'Accounts_AllowPasswordChange', true),
				setSettingValueById(api, 'Accounts_TwoFactorAuthentication_Enabled', false),
				setSettingValueById(api, 'E2E_Enable', false),
			]);
		});

		test.beforeEach(async () => {
			await accountSecurityPage.header.waitFor({ state: 'visible' });
		});

		test('security page is visible when password change is enabled but 2FA and E2E are disabled', async () => {
			await expect(accountSecurityPage.sidenav.securityLink).toBeVisible();
		});

		test('can access password change when enabled but 2FA and E2E are disabled', async () => {
			await expect(accountSecurityPage.password.toggleButton).toBeVisible();
		});

		test('can access 2FA setting when enabled but password change and E2E are disabled', async ({ api }) => {
			await Promise.all([
				setSettingValueById(api, 'Accounts_AllowPasswordChange', false),
				setSettingValueById(api, 'Accounts_TwoFactorAuthentication_Enabled', true),
				setSettingValueById(api, 'E2E_Enable', false),
			]);

			await expect(accountSecurityPage.twoFactorAuthentication.toggleButton).toBeVisible();
		});

		test('can access E2E setting when enabled but password change and 2FA are disabled', async ({ api }) => {
			await Promise.all([
				setSettingValueById(api, 'Accounts_AllowPasswordChange', false),
				setSettingValueById(api, 'Accounts_TwoFactorAuthentication_Enabled', false),
				setSettingValueById(api, 'E2E_Enable', true),
			]);

			await expect(accountSecurityPage.e2ee.toggleButton).toBeVisible();
		});
	});
});
