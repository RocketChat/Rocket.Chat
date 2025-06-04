import { DEFAULT_USER_CREDENTIALS } from './config/constants';
import { AccountProfile, Registration, Utils } from './page-objects';
import { test, expect } from './utils/test';
import { createTestUser, type ITestUser } from './utils/user-helpers';

test.describe('Delete Own Account', () => {
	let poAccountProfile: AccountProfile;
	let poRegistration: Registration;
	let poUtils: Utils;
	let testUser: ITestUser;
	let testUser2: ITestUser;

	test.beforeAll(async ({ api }) => {
		const response = await api.post('/settings/Accounts_AllowDeleteOwnAccount', { value: true });
		expect(response.status()).toBe(200);
		testUser = await createTestUser(api, { username: 'user-to-delete' });
		testUser2 = await createTestUser(api, { username: 'user-with-invalid-username' });
	});

	test.beforeEach(async ({ page }) => {
		poAccountProfile = new AccountProfile(page);
		poRegistration = new Registration(page);
		poUtils = new Utils(page);
		await page.goto('/home');
	});

	test.afterAll(async ({ api }) => {
		const response = await api.post('/settings/Accounts_AllowDeleteOwnAccount', { value: false });
		expect(response.status()).toBe(200);
		await testUser.delete();
		await testUser2.delete();
	});

	test('should not delete account when invalid username is provided', async ({ page }) => {
		await test.step('login with the user to delete', async () => {
			await poRegistration.username.type(testUser2.data.username);
			await poRegistration.inputPassword.type(DEFAULT_USER_CREDENTIALS.password);
			await poRegistration.btnLogin.click();
			await expect(poUtils.mainContent).toBeVisible();
		});

		await test.step('navigate to profile and locate Delete My Account button', async () => {
			await page.goto('/account/profile');
			await poAccountProfile.profileTitle.waitFor({ state: 'visible' });
			await poAccountProfile.btnDeleteMyAccount.click();
			await expect(poAccountProfile.deleteAccountDialog).toBeVisible();
		});

		await test.step('enter invalid username in the confirmation field and click delete account', async () => {
			await poAccountProfile.inputDeleteAccountUsername.fill('invalid-username');
			await expect(poAccountProfile.inputDeleteAccountUsername).toHaveValue('invalid-username');
			await poAccountProfile.btnDeleteAccountConfirm.click();
		});

		await test.step('verify error message appears', async () => {
			await expect(poAccountProfile.deleteAccountErrorMessage).toBeVisible();
		});

		await test.step('verify user is still on the profile page', async () => {
			await expect(poAccountProfile.profileTitle).toBeVisible();
		});
	});

	// TODO: Remove test.fail() when functionality is fixed
	test.fail('should delete account when valid username is provided and permission is enabled', async ({ page }) => {
		await test.step('login with the user to delete', async () => {
			await poRegistration.username.type(testUser.data.username);
			await poRegistration.inputPassword.type(DEFAULT_USER_CREDENTIALS.password);
			await poRegistration.btnLogin.click();
			await expect(poUtils.mainContent).toBeVisible();
		});

		await test.step('navigate to profile and locate Delete My Account button', async () => {
			await page.goto('/account/profile');
			await poAccountProfile.profileTitle.waitFor({ state: 'visible' });
			await poAccountProfile.btnDeleteMyAccount.click();
			await expect(poAccountProfile.deleteAccountDialog).toBeVisible();
		});

		await test.step('verify delete confirmation dialog appears', async () => {
			await expect(poAccountProfile.deleteAccountDialogMessage).toBeVisible();
			await expect(poAccountProfile.inputDeleteAccountUsername).toBeVisible();
			await expect(poAccountProfile.btnDeleteAccountConfirm).toBeVisible();
			await expect(poAccountProfile.btnDeleteAccountCancel).toBeVisible();
		});

		await test.step('enter username in the confirmation field and click delete account', async () => {
			await poAccountProfile.inputDeleteAccountUsername.fill(testUser.data.username);
			await expect(poAccountProfile.inputDeleteAccountUsername).toHaveValue(testUser.data.username);
			await poAccountProfile.btnDeleteAccountConfirm.click();
		});

		await test.step('verify user is redirected to login page', async () => {
			await expect(poRegistration.btnLogin).toBeVisible();
			testUser.markAsDeleted();
		});
	});

	test.describe('Delete Own Account - Permission Disabled', () => {
		test.beforeAll(async ({ api }) => {
			const response = await api.post('/settings/Accounts_AllowDeleteOwnAccount', { value: false });
			expect(response.status()).toBe(200);
		});

		test('should not show delete account button when permission is disabled', async ({ page }) => {
			await test.step('login with the user to delete', async () => {
				await poRegistration.username.type(testUser.data.username);
				await poRegistration.inputPassword.type(DEFAULT_USER_CREDENTIALS.password);
				await poRegistration.btnLogin.click();
				await expect(poUtils.mainContent).toBeVisible();
			});

			await test.step('navigate to profile and locate Delete My Account button', async () => {
				await page.goto('/account/profile');
				await poAccountProfile.profileTitle.waitFor({ state: 'visible' });
				await expect(poAccountProfile.btnDeleteMyAccount).not.toBeVisible();
			});
		});
	});
});
