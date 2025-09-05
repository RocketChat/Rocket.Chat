import { Users } from './fixtures/userStates';
import { Admin } from './page-objects';
import { ToastBar } from './page-objects/toastBar';
import { test, expect } from './utils/test';
import type { ITestUser } from './utils/user-helpers';
import { createTestUser } from './utils/user-helpers';

let userWithoutAdminAccess: ITestUser;
let userWithAdminAccess: ITestUser;
let admin: Admin;
let poToastBar: ToastBar;

test.describe('Admin > Users Role Management', () => {
	test.beforeAll('Create test users', async ({ api }) => {
		userWithoutAdminAccess = await createTestUser(api);
		userWithAdminAccess = await createTestUser(api, { roles: ['admin'] });
	});

	test.afterAll('Delete test users', async () => {
		await userWithoutAdminAccess.delete();
		await userWithAdminAccess.delete();
	});

	test.describe('Admin Role Management', () => {
		test.use({ storageState: Users.admin.state });

		test.beforeEach('Go to /admin/users', async ({ page }) => {
			admin = new Admin(page);
			poToastBar = new ToastBar(page);
			await page.goto('/admin/users');
		});

		test('Make a newly created user as admin', async () => {
			await admin.tabs.users.inputSearch.fill(userWithoutAdminAccess.data.username);

			await test.step('should be visible in the All tab', async () => {
				await admin.tabs.users.tabAll.click();
				await expect(admin.getUserRowByUsername(userWithoutAdminAccess.data.username)).toBeVisible();
			});

			await test.step('make a user admin', async () => {
				await admin.tabs.users.openUserActionMenu(userWithoutAdminAccess.data.username);
				await admin.tabs.users.menuItemMakeAdmin.click();
				await expect(poToastBar.alert).toBeVisible();
				await expect(poToastBar.alert).toHaveText('User is now an admin');
			});

			await test.step('verify user is admin', async () => {
				await admin.getUserRowByUsername(userWithoutAdminAccess.data.username).click();
				await expect(admin.tabs.users.userInfoDialog).toBeVisible();
				await expect(admin.tabs.users.userInfoDialog).toContainText('Admin');
			});
		});

		test('Remove role as admin', async () => {
			await admin.tabs.users.inputSearch.fill(userWithAdminAccess.data.username);
			await test.step('User should be visible in the All tab', async () => {
				await admin.tabs.users.tabAll.click();
				await expect(admin.getUserRowByUsername(userWithAdminAccess.data.username)).toBeVisible();
			});

			await test.step('remove admin role', async () => {
				await admin.tabs.users.openUserActionMenu(userWithAdminAccess.data.username);
				await admin.tabs.users.menuItemRemoveAdmin.click();
				await expect(poToastBar.alert).toBeVisible();
				await expect(poToastBar.alert).toHaveText('User is no longer an admin');
			});

			await test.step('verify user role as admin is removed', async () => {
				await admin.getUserRowByUsername(userWithAdminAccess.data.username).click();
				await expect(admin.tabs.users.userInfoDialog).toBeVisible();
				await expect(admin.tabs.users.userInfoDialog).not.toHaveText('Admin');
			});
		});
	});
});
