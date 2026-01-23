import { Users } from './fixtures/userStates';
import { AdminUsers } from './page-objects';
import { test, expect } from './utils/test';
import type { ITestUser } from './utils/user-helpers';
import { createTestUser } from './utils/user-helpers';

let userWithoutAdminAccess: ITestUser;
let userWithAdminAccess: ITestUser;
let admin: AdminUsers;

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
			admin = new AdminUsers(page);
			await page.goto('/admin/users');
		});

		test('Make a newly created user as admin', async () => {
			await test.step('should be visible in the All tab', async () => {
				await admin.getTabByName().click();
				await admin.searchUser(userWithoutAdminAccess.data.username);
			});

			await test.step('make a user admin', async () => {
				await admin.dispatchUserAction(userWithoutAdminAccess.data.username, 'Make Admin');
				await admin.toastMessage.waitForDisplay({ type: 'success', message: 'User is now an admin' });
			});

			await test.step('verify user is admin', async () => {
				await admin.getUserRowByUsername(userWithoutAdminAccess.data.username).click();
				await expect(admin.userInfo.root).toBeVisible();
				await expect(admin.userInfo.root).toContainText('Admin');
			});
		});

		test('Remove role as admin', async () => {
			await test.step('User should be visible in the All tab', async () => {
				await admin.getTabByName().click();
				await admin.searchUser(userWithAdminAccess.data.username);
			});

			await test.step('remove admin role', async () => {
				await admin.dispatchUserAction(userWithAdminAccess.data.username, 'Remove Admin');
				await admin.toastMessage.waitForDisplay({ type: 'success', message: 'User is no longer an admin' });
			});

			await test.step('verify user role as admin is removed', async () => {
				await admin.getUserRowByUsername(userWithAdminAccess.data.username).click();
				await expect(admin.userInfo.root).toBeVisible();
				await expect(admin.userInfo.root).not.toHaveText('Admin');
			});
		});
	});
});
