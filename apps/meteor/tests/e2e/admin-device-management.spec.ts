import type { Page } from 'playwright-core';

import { IS_EE } from './config/constants';
import { createAuxContext } from './fixtures/createAuxContext';
import injectInitialData from './fixtures/inject-initial-data';
import { Users } from './fixtures/userStates';
import { Registration } from './page-objects';
import { AdminDeviceManagement } from './page-objects/admin-device-management';
import { test, expect } from './utils/test';

test.describe('Admin Device Management Page', () => {
	test.skip(!IS_EE);
	test.use({ storageState: Users.admin.state });

	let page: Page;
	let adminDeviceManagement: AdminDeviceManagement;
	let loginPage: Registration;

	test.beforeEach(async ({ browser }) => {
		({ page } = await createAuxContext(browser, Users.admin));
		adminDeviceManagement = new AdminDeviceManagement(page);
		loginPage = new Registration(page);
		await page.goto('/admin/device-management');
	});

	test.afterEach(async () => {
		await page.close();
		await injectInitialData();
	});

	test('should show Device management page', async () => {
		await expect(adminDeviceManagement.adminPageContent).toBeVisible();
	});

	test('should logout current device and redirect to login page', async () => {
		const deviceId = await adminDeviceManagement.getUsersDeviceId('rocketchat.internal.admin.test');
		await adminDeviceManagement.logoutDeviceById(deviceId);
		await expect(loginPage.loginForm).toBeVisible();
	});

	test('should logout current device from device info tab and redirect to login page', async () => {
		const deviceId = await adminDeviceManagement.getUsersDeviceId('rocketchat.internal.admin.test');
		await adminDeviceManagement.searchUserDevice('rocketchat.internal.admin.test');
		await adminDeviceManagement.table.getDeviceRowById(deviceId).click();

		await expect(adminDeviceManagement.deviceInfo.getDeviceInfoId(deviceId)).toBeVisible();
		await adminDeviceManagement.deviceInfo.btnLogoutDevice.click();
		await adminDeviceManagement.logoutModal.confirmLogout();
		await expect(loginPage.loginForm).toBeVisible();
	});

	test('should logout other device successfully', async ({ browser }) => {
		const user2Page = await browser.newPage({ storageState: Users.user2.state });
		const loginPage2 = new Registration(user2Page);
		await user2Page.goto('/');
		await expect(user2Page.getByRole('main')).toBeVisible();

		const user2DeviceId = await adminDeviceManagement.getUsersDeviceId('user2');

		await test.step('should logout user2 and redirect to login page', async () => {
			await adminDeviceManagement.logoutDeviceById(user2DeviceId);
			await loginPage2.loginForm.waitFor();
			await expect(loginPage2.loginForm).toBeVisible();
		});

		await test.step('should no longer show user2 device in admin device management page', async () => {
			await adminDeviceManagement.searchUserDevice('user2');
			await expect(adminDeviceManagement.table.getDeviceRowById(user2DeviceId)).not.toBeVisible();
		});

		await user2Page.close();
	});
});
