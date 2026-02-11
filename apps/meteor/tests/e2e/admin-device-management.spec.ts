import { IS_EE } from './config/constants';
import { Users } from './fixtures/userStates';
import { AdminDeviceManagement } from './page-objects/admin-device-management';
import { test, expect } from './utils/test';

test.use({ storageState: Users.admin.state });

test.describe('Admin Device Management Page', () => {
	test.skip(!IS_EE);

	let adminDeviceManagement: AdminDeviceManagement;

	test.beforeEach(async ({ page }) => {
		adminDeviceManagement = new AdminDeviceManagement(page);
		await page.goto('/admin/device-management');
	});

	test('should show Device management page', async () => {
		await expect(adminDeviceManagement.adminPageContent).toBeVisible();
	});

	test('should logout current device and redirect to login page', async ({ page }) => {
		const deviceId = await adminDeviceManagement.getUsersDeviceId('rocketchat.internal.admin.test');
		await adminDeviceManagement.logoutDeviceById(deviceId);
		await expect(page.getByRole('form', { name: 'Login' })).toBeVisible();
	});

	test('should logout current device from device info tab and redirect to login page', async ({ page }) => {
		const deviceId = await adminDeviceManagement.getUsersDeviceId('rocketchat.internal.admin.test');
		await adminDeviceManagement.searchUserDevice('rocketchat.internal.admin.test');
		await adminDeviceManagement.getDeviceRowById(deviceId).click();

		await expect(adminDeviceManagement.deviceInfo.getDeviceInfoId(deviceId)).toBeVisible();
		await adminDeviceManagement.deviceInfo.btnLogoutDevice.click();
		await adminDeviceManagement.logoutModal.confirmLogout();
		await expect(page.getByRole('form', { name: 'Login' })).toBeVisible();
	});

	test('should logout other device successfully', async ({ browser }) => {
		const user2Page = await browser.newPage({ storageState: Users.user2.state });
		await user2Page.goto('/');
		const user2DeviceId = await adminDeviceManagement.getUsersDeviceId('user2');

		await test.step('should logout user2 and redirect to login page', async () => {
			await adminDeviceManagement.logoutDeviceById(user2DeviceId);
			await expect(user2Page.getByRole('form', { name: 'Login' })).toBeVisible();
		});

		await test.step('should no longer show user2 device in admin device management page', async () => {
			await adminDeviceManagement.searchUserDevice('rocketchat.internal.user2.test');
			await expect(adminDeviceManagement.getDeviceRowById(user2DeviceId)).not.toBeVisible();
		});

		await user2Page.close();
	});
});
