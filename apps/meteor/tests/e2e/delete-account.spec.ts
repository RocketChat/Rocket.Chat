import { DEFAULT_USER_CREDENTIALS } from './config/constants';
import { AccountProfile, Registration, Utils } from './page-objects';
import { ToastBar } from './page-objects/toastBar';
import { test, expect } from './utils/test';
import { createTestUser, type ITestUser } from './utils/user-helpers';

test.describe('Delete Own Account', () => {
	let poAccountProfile: AccountProfile;
	let poRegistration: Registration;
	let poToastBar: ToastBar;
	let poUtils: Utils;
	let userToDelete: ITestUser;
	let userWithInvalidPassword: ITestUser;
	let userWithoutPermissions: ITestUser;

	test.beforeAll(async ({ api }) => {
		const response = await api.post('/settings/Accounts_AllowDeleteOwnAccount', { value: true });
		expect(response.status()).toBe(200);
		userToDelete = await createTestUser(api, { username: 'user-to-delete' });
		userWithInvalidPassword = await createTestUser(api, { username: 'user-with-invalid-password' });
		userWithoutPermissions = await createTestUser(api, { username: 'user-without-permissions' });
	});

	test.beforeEach(async ({ page }) => {
		poAccountProfile = new AccountProfile(page);
		poRegistration = new Registration(page);
		poToastBar = new ToastBar(page);
		poUtils = new Utils(page);
		await page.goto('/home');
	});

	test.afterAll(async ({ api }) => {
		await Promise.all([
			api.post('/settings/Accounts_AllowDeleteOwnAccount', { value: false }).then((res) => expect(res.status()).toBe(200)),
			userToDelete.delete(),
			userWithInvalidPassword.delete(),
			userWithoutPermissions.delete(),
		]);
	});

	test('should not delete account when invalid password is provided', async ({ page }) => {
		await test.step('login with the user to delete', async () => {
			await poRegistration.username.fill(userWithInvalidPassword.data.username);
			await poRegistration.inputPassword.fill(DEFAULT_USER_CREDENTIALS.password);
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
			await expect(poAccountProfile.deleteAccountDialogMessageWithPassword).toBeVisible();
			await expect(poAccountProfile.inputDeleteAccountPassword).toBeVisible();
			await expect(poAccountProfile.btnDeleteAccountConfirm).toBeVisible();
			await expect(poAccountProfile.btnDeleteAccountCancel).toBeVisible();
		});

		await test.step('enter invalid password in the confirmation field and click delete account', async () => {
			await poAccountProfile.inputDeleteAccountPassword.fill('invalid-password');
			await expect(poAccountProfile.inputDeleteAccountPassword).toHaveValue('invalid-password');
			await poAccountProfile.btnDeleteAccountConfirm.click();
		});

		await test.step('verify error message appears', async () => {
			await expect(poToastBar.alert).toBeVisible();
			await expect(poToastBar.alert).toHaveText('Invalid password [error-invalid-password]');
		});

		await test.step('verify user is still on the profile page', async () => {
			await expect(poAccountProfile.profileTitle).toBeVisible();
		});
	});

	test('should delete account when valid password is provided and permission is enabled', async ({ page }) => {
		await test.step('login with the user to delete', async () => {
			await poRegistration.username.fill(userToDelete.data.username);
			await poRegistration.inputPassword.fill(DEFAULT_USER_CREDENTIALS.password);
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
			await expect(poAccountProfile.deleteAccountDialogMessageWithPassword).toBeVisible();
			await expect(poAccountProfile.inputDeleteAccountPassword).toBeVisible();
			await expect(poAccountProfile.btnDeleteAccountConfirm).toBeVisible();
			await expect(poAccountProfile.btnDeleteAccountCancel).toBeVisible();
		});

		await test.step('enter password in the confirmation field and click delete account', async () => {
			await poAccountProfile.inputDeleteAccountPassword.fill(DEFAULT_USER_CREDENTIALS.password);
			await expect(poAccountProfile.inputDeleteAccountPassword).toHaveValue(DEFAULT_USER_CREDENTIALS.password);
			await poAccountProfile.btnDeleteAccountConfirm.click();
		});

		await test.step('verify user is redirected to login page', async () => {
			await expect(poRegistration.btnLogin).toBeVisible();
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
				await poRegistration.username.fill(userWithoutPermissions.data.username);
				await poRegistration.inputPassword.fill(DEFAULT_USER_CREDENTIALS.password);
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
