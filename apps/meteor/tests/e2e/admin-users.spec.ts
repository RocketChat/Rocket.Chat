import { Users } from './fixtures/userStates';
import { AdminUsers } from './page-objects';
import { setSettingValueById } from './utils/setSettingValueById';
import { test, expect } from './utils/test';
import type { ITestUser } from './utils/user-helpers';
import { createTestUser } from './utils/user-helpers';

let user: ITestUser;
let admin: AdminUsers;

test.use({ storageState: Users.admin.state });

test.describe('Admin > Users', () => {
	test.beforeAll('Create a new user', async ({ api }) => {
		await setSettingValueById(api, 'Accounts_ManuallyApproveNewUsers', true);
		user = await createTestUser(api);
	});

	test.afterAll('Delete the new user', async ({ api }) => {
		await user.delete();
		await setSettingValueById(api, 'Accounts_ManuallyApproveNewUsers', false);
	});

	test.beforeEach('Go to /admin/users', async ({ page }) => {
		admin = new AdminUsers(page);
		await page.goto('/admin/users');
	});

	test('New user shows in correct tabs when deactivated', async () => {
		await test.step('should be visible in the All tab', async () => {
			await admin.getTabByName().click();
			await admin.searchUser(user.data.username);
		});

		await test.step('should be visible in the Pending tab', async () => {
			await admin.getTabByName('Pending').click();
			await expect(admin.getUserRowByUsername(user.data.username)).toBeVisible();
		});

		await test.step('should not be visible in the Active tab', async () => {
			await admin.getTabByName('Active').click();
			await expect(admin.getUserRowByUsername(user.data.username)).not.toBeVisible();
		});

		await test.step('should not be visible in the Deactivated tab', async () => {
			await admin.getTabByName('Deactivated').click();
			await expect(admin.getUserRowByUsername(user.data.username)).not.toBeVisible();
		});

		await test.step('should move from Pending to Active tab', async () => {
			await admin.getTabByName('Pending').click();
			await admin.dispatchUserAction(user.data.username, 'Activate');
			await expect(admin.getUserRowByUsername(user.data.username)).not.toBeVisible();
			await admin.getTabByName('Active').click();
			await expect(admin.getUserRowByUsername(user.data.username)).toBeVisible();
		});

		await test.step('should move from Active to Deactivated tab', async () => {
			await admin.getTabByName('Active').click();
			await admin.dispatchUserAction(user.data.username, 'Deactivate');
			await expect(admin.getUserRowByUsername(user.data.username)).not.toBeVisible();
			await admin.getTabByName('Deactivated').click();
			await expect(admin.getUserRowByUsername(user.data.username)).toBeVisible();
		});
	});
});
