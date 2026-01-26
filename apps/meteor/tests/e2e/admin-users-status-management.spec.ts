import type { BrowserContext, Page } from '@playwright/test';

import { DEFAULT_USER_CREDENTIALS } from './config/constants';
import { Users } from './fixtures/userStates';
import { AdminUsers, Registration, Authenticated } from './page-objects';
import { test, expect } from './utils/test';
import type { ITestUser } from './utils/user-helpers';
import { createTestUser } from './utils/user-helpers';

let user: ITestUser;
let adminUsers: AdminUsers;

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
		let poAuth: Authenticated;

		test.beforeAll(async ({ browser }) => {
			context = await browser.newContext();
			page = await context.newPage();
			poRegistration = new Registration(page);
			poAuth = new Authenticated(page);
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
				await poAuth.waitForDisplay();
			});
		});
	});

	test.describe('Admin > Users Status Management', () => {
		test.use({ storageState: Users.admin.state });

		test.beforeEach('Go to /admin/users', async ({ page }) => {
			adminUsers = new AdminUsers(page);
			await page.goto('/admin/users');
		});

		test('After the first login, the user gets listed under the Active tab', async () => {
			await test.step('should be visible in the All tab', async () => {
				await adminUsers.getTabByName().click();
				await adminUsers.searchUser(user.data.username);
			});

			await test.step('should not be visible in the Pending tab', async () => {
				await adminUsers.getTabByName('Pending').click();
				await expect(adminUsers.getUserRowByUsername(user.data.username)).not.toBeVisible();
			});

			await test.step('should be visible in the Active tab', async () => {
				await adminUsers.getTabByName('Active').click();
				await expect(adminUsers.getUserRowByUsername(user.data.username)).toBeVisible();
			});

			await test.step('should not be visible in the Deactivated tab', async () => {
				await adminUsers.getTabByName('Deactivated').click();
				await expect(adminUsers.getUserRowByUsername(user.data.username)).not.toBeVisible();
			});
		});
	});
});
