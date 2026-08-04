import type { Page } from 'playwright-core';

import { IS_EE } from './config/constants';
import { createAuxContext } from './fixtures/createAuxContext';
import injectInitialData from './fixtures/inject-initial-data';
import { Users } from './fixtures/userStates';
import { HomeChannel, Login, Registration } from './page-objects';
import { AdminDeviceManagement } from './page-objects/admin-device-management';
import { test, expect } from './utils/test';

test.describe('Admin Device Management Page', () => {
	test.skip(!IS_EE);
	test.use({ storageState: Users.admin.state });

	let page: Page;
	let adminDeviceManagement: AdminDeviceManagement;
	let poLogin: Login;

	test.beforeEach(async ({ browser }) => {
		({ page } = await createAuxContext(browser, Users.admin));
		adminDeviceManagement = new AdminDeviceManagement(page);
		poLogin = new Login(page);
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
		await poLogin.waitForDisplay();
	});

	test('should logout current device from device info tab and redirect to login page', async () => {
		const deviceId = await adminDeviceManagement.getUsersDeviceId('rocketchat.internal.admin.test');
		await adminDeviceManagement.searchUserDevice('rocketchat.internal.admin.test');
		await adminDeviceManagement.table.getDeviceRowById(deviceId).click();

		await expect(adminDeviceManagement.deviceInfo.getDeviceInfoId(deviceId)).toBeVisible();
		await adminDeviceManagement.deviceInfo.btnLogoutDevice.click();
		await adminDeviceManagement.logoutModal.confirmLogout();
		await poLogin.waitForDisplay();
	});

	test('should logout other device successfully', async ({ browser }) => {
		const user2Page = await browser.newPage({ storageState: Users.user2.state });
		const loginPage2 = new Registration(user2Page);
		await user2Page.goto('/');
		await expect(user2Page.getByRole('main')).toBeVisible();

		const user2DeviceId = await adminDeviceManagement.getUsersDeviceId('user2');

		await test.step('should logout user2 and redirect to login page', async () => {
			await adminDeviceManagement.logoutDeviceById(user2DeviceId);
			await loginPage2.waitForDisplay();
		});

		await test.step('should no longer show user2 device in admin device management page', async () => {
			await adminDeviceManagement.searchUserDevice('user2');
			await expect(adminDeviceManagement.table.getDeviceRowById(user2DeviceId)).not.toBeVisible();
		});

		await user2Page.close();
	});

	test('should remove user2 from device list when user2 logs out from their own session', async ({ browser }) => {
		const user2Page = await browser.newPage({ storageState: Users.user2.state });
		const loginPage2 = new Registration(user2Page);
		const poUser2Home = new HomeChannel(user2Page);

		await poUser2Home.goto();
		await poUser2Home.waitForHome();

		await test.step('should list user2 device while user2 is logged in', async () => {
			await expect(adminDeviceManagement.adminPageContent).toBeVisible();
			await adminDeviceManagement.searchUserDevice('user2');
			const rowCount = await adminDeviceManagement.table.countRowsForUsername('user2');
			expect(rowCount).toBe(1);
		});

		await test.step('should log user2 out from the app and redirect to login page', async () => {
			await poUser2Home.navbar.logout();
			await loginPage2.waitForDisplay();
		});

		await test.step('should no longer show user2 device in admin device management page', async () => {
			await page.reload();
			await expect(adminDeviceManagement.adminPageContent).toBeVisible();
			await adminDeviceManagement.searchUserDevice('user2');
			const rowCount = await adminDeviceManagement.table.countRowsForUsername('user2');
			expect(rowCount).toBe(0);
		});

		await user2Page.close();
	});

	test('Should show empty state when searching for user without result', async () => {
		const noResultQuery = 'nonexistentuser';
		await adminDeviceManagement.searchUserDevice('noResultQuery');
		const count = await adminDeviceManagement.table.countRowsForUsername(noResultQuery);
		expect(count).toBe(0);
		await expect(adminDeviceManagement.emptyState).toBeVisible();
	});
});

test.describe('Admin Device Management Page - unauthorized access', () => {
	test.skip(!IS_EE);
	test.use({ storageState: Users.user2.state });

	test('should not access device-management when user has no view-device-management permission', async ({ page }) => {
		const user2DeviceManagement = new AdminDeviceManagement(page);
		await page.goto('/admin/device-management');
		await expect(user2DeviceManagement.notAuthorizedMessage).toBeVisible();
		await expect(user2DeviceManagement.adminPageContent).not.toBeVisible();
	});
});
