import { IS_EE } from './config/constants';
import { Users } from './fixtures/userStates';
import { HomeChannel, AccountProfile } from './page-objects';
import { createCustomRole, deleteCustomRole } from './utils/custom-role';
import { test, expect } from './utils/test';

test.use({ storageState: Users.admin.state });

test.describe('enforce two factor authentication', () => {
	test.skip(!IS_EE, 'Enterprise Only');

	let poHomeChannel: HomeChannel;
	let poAccountProfile: AccountProfile;
	let customRoleId = '';
	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);
		poAccountProfile = new AccountProfile(page);
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
		await poAccountProfile.required2faModalSetUpButton.click();
		await expect(poHomeChannel.sidenav.sidebarHomeAction).not.toBeVisible();

		await expect(poAccountProfile.securityHeader).toBeVisible();

		await expect(poAccountProfile.security2FASection).toHaveAttribute('aria-expanded', 'true');
		await expect(poAccountProfile.email2FASwitch).toBeVisible();
		await poAccountProfile.email2FASwitch.click();

		await expect(poHomeChannel.toastSuccess).toBeVisible();
		await expect(poHomeChannel.sidenav.sidebarHomeAction).toBeVisible();
		await expect(poAccountProfile.securityHeader).not.toBeVisible();
	});
});
