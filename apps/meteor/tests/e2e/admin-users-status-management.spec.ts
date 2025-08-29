import type { BrowserContext, Page } from 'playwright-core';

import { DEFAULT_USER_CREDENTIALS } from './config/constants';
import { Users } from './fixtures/userStates';
import { Admin, Registration, Utils } from './page-objects';
import { test, expect } from './utils/test';
import type { ITestUser } from './utils/user-helpers';
import { createTestUser } from './utils/user-helpers';

let user: ITestUser;
let admin: Admin;

test.describe.serial('Admin > Users', () => {
	test.beforeAll('Create a new user', async ({ api }) => {
		user = await createTestUser(api);
	});

	test.afterAll('Delete the new user', async () => {
		await user.delete();
	});
	test.describe('Login', () => {
		let context: BrowserContext;
		let page: Page;
		let poRegistration: Registration;
		let poUtils: Utils;

		test.beforeAll(async ({ browser }) => {
			context = await browser.newContext();
			page = await context.newPage();
			poRegistration = new Registration(page);
			poUtils = new Utils(page);
		});

		test.afterAll(async () => {
			await context.close();
		});

		test('Login as a newly created user and verify its status is active', async () => {
			await page.goto('/login');
			await test.step('should log in as the newly created user', async () => {
				await poRegistration.username.fill(user.data.username);
				await poRegistration.inputPassword.fill(DEFAULT_USER_CREDENTIALS.password);
				await poRegistration.btnLogin.click();
			});

			await test.step('Assert user is logged in', async () => {
				await expect(poUtils.mainContent).toBeVisible();
			});
		});
	});

	test.describe('Admin > Users Status Management', () => {
		// test.beforeAll('Create a new user', async ({ api }) => {
		// 	user = await createTestUser(api);
		// });

		// test.afterAll('Delete the new user', async () => {
		// 	await user.delete();
		// });

		// test.describe('New user tab visibility on deactivation', () => {
		test.use({ storageState: Users.admin.state });

		test.beforeEach('Go to /admin/users', async ({ page }) => {
			admin = new Admin(page);
			await page.goto('/admin/users');
		});

		test('After the first login, the user gets listed under the Active tab', async () => {
			await admin.tabs.users.inputSearch.fill(user.data.username);

			await test.step('should be visible in the All tab', async () => {
				await admin.tabs.users.tabActive.click();
				await expect(admin.getUserRowByUsername(user.data.username)).toBeVisible();
			});

			await test.step('should not be visible in the Pending tab', async () => {
				await admin.tabs.users.tabPending.click();
				await expect(admin.getUserRowByUsername(user.data.username)).not.toBeVisible();
			});

			await test.step('should be visible in the Active tab', async () => {
				await admin.tabs.users.tabActive.click();
				await expect(admin.getUserRowByUsername(user.data.username)).toBeVisible();
			});

			await test.step('should not be visible in the Deactivated tab', async () => {
				await admin.tabs.users.tabDeactivated.click();
				await expect(admin.getUserRowByUsername(user.data.username)).not.toBeVisible();
			});
		});
	});
});
