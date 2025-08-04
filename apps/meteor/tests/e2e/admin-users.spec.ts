import type { BrowserContext, Page } from '@playwright/test';

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

	test.describe.serial('New user tab visibility on deactivation', () => {
		test.use({ storageState: Users.admin.state });

		test.beforeEach('Go to /admin/users', async ({ page }) => {
			admin = new Admin(page);
			await page.goto('/admin/users');
		});
		test('New user shows in correct tabs when deactivated', async ({ page }) => {
			await admin.tabs.users.inputSearch.fill(user.data.username);

			await test.step('is visible in the All tab', async () => {
				await admin.tabs.users.tabAll.click();
				await expect(admin.getUserRowByUsername(user.data.username)).toBeVisible();
			});

			await test.step('is visible in the Pending tab', async () => {
				await admin.tabs.users.tabPending.click();
				await expect(admin.getUserRowByUsername(user.data.username)).toBeVisible();
			});

			await test.step('is not visible in the Active tab', async () => {
				await admin.tabs.users.tabActive.click();
				await expect(admin.getUserRowByUsername(user.data.username)).not.toBeVisible();
			});

			await test.step('is not visible in the Deactivated tab', async () => {
				await admin.tabs.users.tabDeactivated.click();
				await expect(admin.getUserRowByUsername(user.data.username)).not.toBeVisible();
			});

			await test.step('moves from Pending to Deactivated tab', async () => {
				await page.getByRole('tab', { name: 'Pending' }).click();
				await admin.tabs.users.btnMoreActionsMenu.click();
				await admin.tabs.users.menuItemDeactivated.click();
				await expect(admin.getUserRowByUsername(user.data.username)).not.toBeVisible();
				await admin.tabs.users.tabDeactivated.click();
				await expect(admin.getUserRowByUsername(user.data.username)).toBeVisible();
			});

			await test.step('moves from Deactivated to Pending tab', async () => {
				await admin.tabs.users.tabDeactivated.click();
				await admin.tabs.users.btnMoreActionsMenu.click();
				await admin.tabs.users.menuItemActivate.click();
				await expect(admin.getUserRowByUsername(user.data.username)).not.toBeVisible();
				await admin.tabs.users.tabPending.click();
				await expect(admin.getUserRowByUsername(user.data.username)).toBeVisible();
			});
		});
	});
	test.describe.serial('Login', () => {
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

	test.describe('User Status Management', () => {
		test.use({ storageState: Users.admin.state });

		test.beforeEach('Go to /admin/users', async ({ page }) => {
			admin = new Admin(page);
			await page.goto('/admin/users');
		});

		test('After the first login, the user gets listed under the Active tab', async () => {
			await admin.tabs.users.inputSearch.fill(user.data.username);

			await test.step('is visible in the All tab', async () => {
				await admin.tabs.users.tabActive.click();
				await expect(admin.getUserRowByUsername(user.data.username)).toBeVisible();
			});

			await test.step('is not visible in the Pending tab', async () => {
				await admin.tabs.users.tabPending.click();
				await expect(admin.getUserRowByUsername(user.data.username)).not.toBeVisible();
			});

			await test.step('is visible in the Active tab', async () => {
				await admin.tabs.users.tabActive.click();
				await expect(admin.getUserRowByUsername(user.data.username)).toBeVisible();
			});

			await test.step('is not visible in the Deactivated tab', async () => {
				await admin.tabs.users.tabDeactivated.click();
				await expect(admin.getUserRowByUsername(user.data.username)).not.toBeVisible();
			});
		});
	});

	test.describe.serial('Admin Role Management', () => {
		test.use({ storageState: Users.admin.state });

		test.beforeEach('Go to /admin/users', async ({ page }) => {
			admin = new Admin(page);
			await page.goto('/admin/users');
		});

		test('Make a newly created user as admin', async () => {
			await admin.tabs.users.inputSearch.fill(user.data.username);

			await test.step('User is visible in the All tab', async () => {
				await admin.tabs.users.tabAll.click();
				await expect(admin.getUserRowByUsername(user.data.username)).toBeVisible();
			});

			await test.step('make a user admin', async () => {
				await admin.tabs.users.openUserActionMenu(user.data.username);
				await admin.tabs.users.menuItemMakeAdmin.click();
				await expect(admin.tabs.users.toastMessage).toContainText('User is now an admin');
			});

			await test.step('verify user is admin', async () => {
				await admin.tabs.users.getUserRowByUsername(user.data.username).click();
				await expect(admin.tabs.users.openDialog).toBeVisible();
				await expect(admin.tabs.users.openDialog).toContainText('Admin');
			});
		});

		test('Remove role as admin', async () => {
			await admin.tabs.users.inputSearch.fill(user.data.username);
			await test.step('User is visible in the All tab', async () => {
				await admin.tabs.users.tabAll.click();
				await expect(admin.getUserRowByUsername(user.data.username)).toBeVisible();
			});

			await test.step('remove admin role', async () => {
				await admin.tabs.users.openUserActionMenu(user.data.username);
				await admin.tabs.users.menuItemRemoveAdmin.click();
				await expect(admin.tabs.users.toastMessage).toHaveText('User is no longer an admin');
			});

			await test.step('verify user role as admin is removed', async () => {
				await admin.tabs.users.getUserRowByUsername(user.data.username).click();
				await expect(admin.tabs.users.openDialog).toBeVisible();
				await expect(admin.tabs.users.openDialog).not.toHaveText('Admin');
			});
		});
	});
});
