import type { Page } from 'playwright-core';

import { IS_EE } from './config/constants';
import { createAuxContext } from './fixtures/createAuxContext';
import injectInitialData from './fixtures/inject-initial-data';
import { Users } from './fixtures/userStates';
import { Registration } from './page-objects';
import { AccountManageDevices } from './page-objects/account.manage-devices';
import { test, expect } from './utils/test';

test.describe('Account Manage Devices Page', () => {
	test.skip(!IS_EE);
	test.use({ storageState: Users.user1.state });

	let page: Page;
	let accountDevices: AccountManageDevices;
	let loginPage: Registration;

	test.beforeEach(async ({ browser }) => {
		({ page } = await createAuxContext(browser, Users.user1));
		accountDevices = new AccountManageDevices(page);
		loginPage = new Registration(page);
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
		await expect(loginPage.loginForm).toBeVisible();
	});

	test('should logout other device successfully', async ({ browser }) => {
		const context2 = await browser.newContext({ storageState: { cookies: [], origins: [] } });
		const page2 = await context2.newPage();
		const loginPage2 = new Registration(page2);
		const accountDevices2 = new AccountManageDevices(page2);

		await test.step('should login same user in another session', async () => {
			await page2.goto('/account/manage-devices');
			await loginPage2.username.type('user1');
			await loginPage2.inputPassword.type('password');
			await loginPage2.btnLogin.click();

			await expect(accountDevices2.devicesPageContent).toBeVisible();
		});

		await test.step('should logout device 1 from session 2', async () => {
			await accountDevices2.table.orderByLastLogin();
			const device1Id = await accountDevices2.getNthDeviceId(2);
			await accountDevices2.logoutDeviceById(device1Id);
			await loginPage.loginForm.waitFor();
			await expect(loginPage.loginForm).toBeVisible();
			await expect(accountDevices2.table.getDeviceRowById(device1Id)).not.toBeVisible();
		});

		await context2.close();
	});
});
