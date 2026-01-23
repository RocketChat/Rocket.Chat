import { IS_EE } from './config/constants';
import { Users } from './fixtures/userStates';
import { HomeChannel, AccountSecurity } from './page-objects';
import { createCustomRole, deleteCustomRole } from './utils/custom-role';
import { setSettingValueById } from './utils/setSettingValueById';
import { test, expect } from './utils/test';

test.use({ storageState: Users.admin.state });

test.describe('enforce two factor authentication', () => {
	test.skip(!IS_EE, 'Enterprise Only');

	let poHomeChannel: HomeChannel;
	let poAccountSecurity: AccountSecurity;
	let customRoleId = '';
	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);
		poAccountSecurity = new AccountSecurity(page);
	});

	test.beforeAll(async ({ api }) => {
		const roleResponse = await createCustomRole(api, { name: 'enforce-2FA', mandatory2fa: true });
		expect(roleResponse.status()).toBe(200);
		const { role } = await roleResponse.json();
		customRoleId = role._id;

		const userUpdateRes = await api.post('/users.update', {
			data: { roles: ['user', customRoleId, 'admin'] },
			userId: 'rocketchat.internal.admin.test',
		});
		expect(userUpdateRes.status()).toBe(200);

		const disableEmail2FA = await api.post('/users.2fa.disableEmail', {});
		expect(disableEmail2FA.status()).toBe(200);
	});

	test.afterAll(async ({ api }) => {
		const userUpdateRes = await api.post('/users.update', {
			data: { roles: ['user', 'admin'] },
			userId: 'rocketchat.internal.admin.test',
		});
		expect(userUpdateRes.status()).toBe(200);

		const deleteRole = await deleteCustomRole(api, 'enforce-2FA');
		expect(deleteRole.status()).toBe(200);

		const enableEmail2FA = await api.post('/users.2fa.enableEmail', {});
		expect(enableEmail2FA.status()).toBe(200);
	});

	test('should redirect to 2FA setup page and setup email 2FA', async ({ page }) => {
		await page.goto('/home');
		await poAccountSecurity.required2faModalSetUpButton.click();
		await expect(poHomeChannel.navbar.btnHome).not.toBeVisible();

		await expect(poAccountSecurity.securityHeader).toBeVisible();

		await expect(poAccountSecurity.security2FASection).toHaveAttribute('aria-expanded', 'true');
		await expect(poAccountSecurity.email2FASwitch).toBeVisible();
		await poAccountSecurity.email2FASwitch.click();

		await poHomeChannel.toastMessage.waitForDisplay();
		await expect(poHomeChannel.navbar.btnHome).toBeVisible();
		await expect(poAccountSecurity.securityHeader).not.toBeVisible();
	});

	test.describe('should still redirect to 2FA setup page when email 2FA is disabled', () => {
		test.beforeAll(async ({ api }) => {
			await setSettingValueById(api, 'Accounts_TwoFactorAuthentication_By_Email_Enabled', false);
		});

		test.afterAll(async ({ api }) => {
			await setSettingValueById(api, 'Accounts_TwoFactorAuthentication_By_Email_Enabled', true);
		});

		test('should redirect to 2FA setup page and show totp 2FA setup', async ({ page }) => {
			await page.goto('/home');
			await poAccountSecurity.required2faModalSetUpButton.click();
			await expect(poHomeChannel.navbar.btnHome).not.toBeVisible();

			await expect(poAccountSecurity.securityHeader).toBeVisible();

			await expect(poAccountSecurity.security2FASection).toHaveAttribute('aria-expanded', 'true');
			await expect(poAccountSecurity.totp2FASwitch).toBeVisible();
			await expect(poAccountSecurity.email2FASwitch).not.toBeVisible();
		});
	});

	test.describe('should not redirect to 2FA setup page when both email and totp 2FA are disabled', () => {
		test.beforeAll(async ({ api }) => {
			await setSettingValueById(api, 'Accounts_TwoFactorAuthentication_By_Email_Enabled', false);
			await setSettingValueById(api, 'Accounts_TwoFactorAuthentication_By_TOTP_Enabled', false);
		});

		test.afterAll(async ({ api }) => {
			await setSettingValueById(api, 'Accounts_TwoFactorAuthentication_By_Email_Enabled', true);
			await setSettingValueById(api, 'Accounts_TwoFactorAuthentication_By_TOTP_Enabled', true);
		});

		test('should not redirect to 2FA setup page', async ({ page }) => {
			await page.goto('/home');
			await expect(poHomeChannel.navbar.btnHome).toBeVisible();
			await expect(poAccountSecurity.securityHeader).not.toBeVisible();
		});
	});
});
