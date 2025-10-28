import { Users } from './fixtures/userStates';
import { Admin } from './page-objects';
import { test, expect } from './utils/test';
import type { ITestUser } from './utils/user-helpers';
import { createTestUser } from './utils/user-helpers';

let user: ITestUser;
let admin: Admin;

test.use({ storageState: Users.admin.state });

test.describe('Admin > Users', () => {
	test.beforeAll('Create a new user', async ({ api }) => {
		user = await createTestUser(api);
	});

	test.afterAll('Delete the new user', async () => {
		await user.delete();
	});

	test.beforeEach('Go to /admin/users', async ({ page }) => {
		admin = new Admin(page);
		await page.goto('/admin/users');
	});
	test('New user shows in correct tabs when deactivated', async () => {
		await admin.tabs.users.inputSearch.fill(user.data.username);

		await test.step('should be visible in the All tab', async () => {
			await admin.tabs.users.tabAll.click();
			await expect(admin.getUserRowByUsername(user.data.username)).toBeVisible();
		});

		await test.step('should be visible in the Pending tab', async () => {
			await admin.tabs.users.tabPending.click();
			await expect(admin.getUserRowByUsername(user.data.username)).toBeVisible();
		});

		await test.step('should not be visible in the Active tab', async () => {
			await admin.tabs.users.tabActive.click();
			await expect(admin.getUserRowByUsername(user.data.username)).not.toBeVisible();
		});

		await test.step('should not be visible in the Deactivated tab', async () => {
			await admin.tabs.users.tabDeactivated.click();
			await expect(admin.getUserRowByUsername(user.data.username)).not.toBeVisible();
		});

		await test.step('should move from Pending to Deactivated tab', async () => {
			await admin.tabs.users.tabPending.click();
			await admin.tabs.users.btnMoreActionsMenu.click();
			await admin.tabs.users.menuItemDeactivated.click();
			await expect(admin.getUserRowByUsername(user.data.username)).not.toBeVisible();
			await admin.tabs.users.tabDeactivated.click();
			await expect(admin.getUserRowByUsername(user.data.username)).toBeVisible();
		});

		await test.step('should move from Deactivated to Pending tab', async () => {
			await admin.tabs.users.tabDeactivated.click();
			await admin.tabs.users.btnMoreActionsMenu.click();
			await admin.tabs.users.menuItemActivate.click();
			await expect(admin.getUserRowByUsername(user.data.username)).not.toBeVisible();
			await admin.tabs.users.tabPending.click();
			await expect(admin.getUserRowByUsername(user.data.username)).toBeVisible();
		});
	});
});
