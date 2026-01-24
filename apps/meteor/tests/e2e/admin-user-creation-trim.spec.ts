import { Users } from './fixtures/userStates';
import { AdminUsers } from './page-objects';
import { SideNav } from './page-objects/fragments';
import { test, expect } from './utils/test';
import { setSettingValueById } from './utils/setSettingValueById';
import { getSettingValueById } from './utils/getSettingValueById';

test.use({ storageState: Users.admin.state });

const newUser = {
	name: 'Trim Test User',
	username: 'trimtestuser',
	email: ' trimtestuser@example.com ',
	emailTrimmed: 'trimtestuser@example.com',
	password: 'password123',
};

test.describe('User Creation & Login - Trim Email', () => {
	let adminUsers: AdminUsers;
	let sideNav: SideNav;
	let initialManuallyApproveNewUsers: boolean;

	test.beforeAll(async ({ api }) => {
		// Store the initial setting value
		initialManuallyApproveNewUsers = (await getSettingValueById(api, 'Accounts_ManuallyApproveNewUsers')) as boolean;

		// Ensure manual approval is off so user is active immediately
		await setSettingValueById(api, 'Accounts_ManuallyApproveNewUsers', false);
	});

	test.beforeEach(async ({ page }) => {
		adminUsers = new AdminUsers(page);
		sideNav = new SideNav(page);
	});

	test('should trim email on admin user creation and login', async ({ page }) => {
		await test.step('Create user with untrimmed email', async () => {
			await page.goto('/admin/users');
			await adminUsers.btnNewUser.click();

			await page.getByRole('dialog').getByRole('textbox', { name: 'Name', exact: true }).fill(newUser.name);
			await adminUsers.editUser.inputUserName.fill(newUser.username);
			await adminUsers.editUser.inputEmail.fill(newUser.email);

			// Select password manually
			await adminUsers.editUser.inputSetManually.click();
			await adminUsers.editUser.inputPassword.fill(newUser.password);

			await adminUsers.editUser.btnAddUser.click();

			// Wait for user to be created and search for it
			await adminUsers.searchUser(newUser.username);
			await expect(adminUsers.getUserRowByUsername(newUser.username)).toBeVisible();
		});

		await test.step('Logout', async () => {
			await sideNav.logout();
		});

		await test.step('Login with trimmed email', async () => {
			// Login with untrimmed email, expecting the app to trim it
			await page.locator('[name=usernameOrEmail]').fill(newUser.email);
			await page.locator('[name=password]').fill(newUser.password);
			await page.locator('button[type=submit]').click();

			// Expect to be logged in
			await expect(page).toHaveURL('/home');
		});
	});

	test.afterAll(async ({ api }) => {
		// Restore setting
		if (initialManuallyApproveNewUsers !== undefined) {
			await setSettingValueById(api, 'Accounts_ManuallyApproveNewUsers', initialManuallyApproveNewUsers);
		}

		// Cleanup
		try {
			await api.post('/users.delete', { username: newUser.username, confirmRelinquish: true });
		} catch (e) {
			// ignore
		}
	});
});