import type { Page } from 'playwright-core';

import { IS_EE } from './config/constants';
import { createAuxContext } from './fixtures/createAuxContext';
import injectInitialData from './fixtures/inject-initial-data';
import { Users } from './fixtures/userStates';
import { AccountManageDevices } from './page-objects/account.manage-devices';
import { test, expect } from './utils/test';

test.describe('Account Manage Devices Page', () => {
	test.skip(!IS_EE);
	test.use({ storageState: Users.user1.state });

	let page: Page;
	let accountDevices: AccountManageDevices;

	test.beforeEach(async ({ browser }) => {
		({ page } = await createAuxContext(browser, Users.user1));
		accountDevices = new AccountManageDevices(page);
		await page.goto('/account/manage-devices');
	});

	test.afterEach(async () => {
		await page.close();
		await injectInitialData();
	});

	test('should show Manage Devices page', async () => {
		await expect(accountDevices.devicesPageContent).toBeVisible();
	});

	test('should logout current device and redirect to login page', async () => {
		await accountDevices.table.orderByLastLogin();

		const deviceId = await accountDevices.getNthDeviceId(1);
		await accountDevices.logoutDeviceById(deviceId);
		await expect(page.getByRole('form', { name: 'Login' })).toBeVisible();
	});

	// TODO: Open different session in playwright
	// test('should logout other device successfully', async ({ browser }) => {
	// 	const user2Context = await browser.newContext({ storageState: Users.user1.state });
	// 	const user2Page = await user2Context.newPage();
	// 	await user2Page.goto('/');
	// 	await expect(user2Page.getByRole('main')).toBeVisible();

	// 	await accountDevices.table.orderByLastLogin();
	// 	const user2DeviceId = await accountDevices.getNthDeviceId(2);

	// 	await test.step('should logout other session and redirect to login page', async () => {
	// 		await accountDevices.logoutDeviceById(user2DeviceId);
	// 		await user2Page.getByRole('form', { name: 'Login' }).waitFor();
	// 		await expect(user2Page.getByRole('form', { name: 'Login' })).toBeVisible();
	// 	});

	// 	await test.step('should no longer show other session device in account manage devices page', async () => {
	// 		await expect(accountDevices.table.getDeviceRowById(user2DeviceId)).not.toBeVisible();
	// 	});

	// 	await user2Page.close();
	// });
});
