import { IS_EE } from './config/constants';
import { Users } from './fixtures/userStates';
import { AdminUsers } from './page-objects';
import { preserveSettings } from './utils/preserveSettings';
import { setSettingValueById } from './utils/setSettingValueById';
import { expect, test } from './utils/test';
import type { ITestUser } from './utils/user-helpers';
import { createTestUser } from './utils/user-helpers';

test.describe('Admin > Users > User status', () => {
	test.skip(!IS_EE);
	test.use({ storageState: Users.admin.state });

	preserveSettings(['Accounts_StatusVisibility_Admin_Enabled']);

	let user: ITestUser;
	let adminUsers: AdminUsers;

	test.beforeAll(async ({ api }) => {
		await setSettingValueById(api, 'Accounts_StatusVisibility_Admin_Enabled', true);
		user = await createTestUser(api);
	});

	test.afterAll(async () => {
		await user.delete();
	});

	test.beforeEach(async ({ page }) => {
		adminUsers = new AdminUsers(page);
		await adminUsers.goto();
	});

	test('turns off a user status from the users page and lists them as managed', async ({ page }) => {
		await test.step('open the edit panel from the user menu', async () => {
			await adminUsers.searchUser(user.data.username);
			await adminUsers.dispatchUserAction(user.data.username, 'Manage user status');

			await expect(adminUsers.editUser.sectionUserStatus).toBeVisible();
		});

		await test.step('turn off the user status', async () => {
			await adminUsers.editUser.toggleShowStatus.click();
			await adminUsers.editUser.btnSaveUser.click();

			await expect(page).toHaveURL(/\/admin\/users\/info\//);
		});

		await test.step('the user is listed only under managed status', async () => {
			await adminUsers.filterByUserStatus('Managed status');
			await expect(adminUsers.getUserRowByUsername(user.data.username)).toBeVisible();

			await adminUsers.filterByUserStatus('Default status');
			await expect(adminUsers.getUserRowByUsername(user.data.username)).not.toBeVisible();
		});
	});
});
