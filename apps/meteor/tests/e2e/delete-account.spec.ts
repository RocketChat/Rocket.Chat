import { DEFAULT_USER_CREDENTIALS } from './config/constants';
import { AccountProfile, Authenticated, Login } from './page-objects';
import { setSettingValueById } from './utils';
import { test, expect } from './utils/test';
import { createTestUser, type ITestUser } from './utils/user-helpers';

test.describe('Delete Own Account', () => {
	let poAccountProfile: AccountProfile;
	let poLogin: Login;
	let poAuth: Authenticated;
	let userToDelete: ITestUser;
	let userWithInvalidPassword: ITestUser;
	let userWithoutPermissions: ITestUser;

	test.beforeAll(async ({ api }) => {
		expect((await setSettingValueById(api, 'Accounts_AllowDeleteOwnAccount', true)).status()).toBe(200);
		userToDelete = await createTestUser(api, { username: 'user-to-delete' });
		userWithInvalidPassword = await createTestUser(api, { username: 'user-with-invalid-password' });
		userWithoutPermissions = await createTestUser(api, { username: 'user-without-permissions' });
	});

	test.beforeEach(async ({ page }) => {
		poAccountProfile = new AccountProfile(page);
		poLogin = new Login(page);
		poAuth = new Authenticated(page);
		await page.goto('/home');
	});

	test.afterAll(async ({ api }) => {
		expect((await setSettingValueById(api, 'Accounts_AllowDeleteOwnAccount', false)).status()).toBe(200);
		await userWithInvalidPassword.delete();
		await userWithoutPermissions.delete();
	});

	test('should not delete account when invalid password is provided', async ({ page }) => {
		await test.step('login with the user to delete', async () => {
			await poLogin.login(userWithInvalidPassword.data.username, DEFAULT_USER_CREDENTIALS.password);
			await poAuth.waitForDisplay();
		});

		await test.step('navigate to profile and locate Delete My Account button', async () => {
			await page.goto('/account/profile');
			await poAccountProfile.profileTitle.waitFor({ state: 'visible' });
			await poAccountProfile.btnDeleteMyAccount.click();
			await poAccountProfile.deleteAccountModal.waitForDisplay();
		});

		await test.step('enter invalid password in the confirmation field and click delete account', async () => {
			await poAccountProfile.deleteAccountModal.inputPassword.fill('invalid-password');
			await expect(poAccountProfile.deleteAccountModal.inputPassword).toHaveValue('invalid-password');
			await poAccountProfile.deleteAccountModal.confirmDelete({ waitForDismissal: false });
		});

		await test.step('verify error message appears', async () => {
			await expect(poAccountProfile.deleteAccountModal.inputErrorMessage).toBeVisible();
		});

		await test.step('verify user is still on the profile page', async () => {
			await expect(poAccountProfile.profileTitle).toBeVisible();
		});
	});

	test('should delete account when valid password is provided and permission is enabled', async ({ page }) => {
		await test.step('login with the user to delete', async () => {
			await poLogin.login(userToDelete.data.username, DEFAULT_USER_CREDENTIALS.password);
			await poAuth.waitForDisplay();
		});

		await test.step('navigate to profile and locate Delete My Account button', async () => {
			await page.goto('/account/profile');
			await poAccountProfile.profileTitle.waitFor({ state: 'visible' });
			await poAccountProfile.btnDeleteMyAccount.click();
			await poAccountProfile.deleteAccountModal.waitForDisplay();
		});

		await test.step('enter password in the confirmation field and click delete account', async () => {
			await poAccountProfile.deleteAccountModal.inputPassword.fill(DEFAULT_USER_CREDENTIALS.password);
			await expect(poAccountProfile.deleteAccountModal.inputPassword).toHaveValue(DEFAULT_USER_CREDENTIALS.password);
			await poAccountProfile.deleteAccountModal.confirmDelete({ waitForDismissal: false });
		});

		await test.step('verify user is redirected to login page', async () => {
			await poLogin.waitForDisplay();
			userToDelete.markAsDeleted();
		});
	});

	test.describe('Delete Own Account - Permission Disabled', () => {
		test.beforeAll(async ({ api }) => {
			const response = await api.post('/settings/Accounts_AllowDeleteOwnAccount', { value: false });
			expect(response.status()).toBe(200);
		});

		test('should not show delete account button when permission is disabled', async ({ page }) => {
			await test.step('login with the user to delete', async () => {
				await poLogin.login(userWithoutPermissions.data.username, DEFAULT_USER_CREDENTIALS.password);
				await poAuth.waitForDisplay();
			});

			await test.step('navigate to profile and locate Delete My Account button', async () => {
				await page.goto('/account/profile');
				await poAccountProfile.profileTitle.waitFor({ state: 'visible' });
				await expect(poAccountProfile.btnDeleteMyAccount).not.toBeVisible();
			});
		});
	});
});
