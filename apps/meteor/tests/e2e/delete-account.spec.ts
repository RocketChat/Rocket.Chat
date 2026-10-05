import type { Browser, Page } from '@playwright/test';

import { DEFAULT_USER_CREDENTIALS } from './config/constants';
import { AccountProfile, Login } from './page-objects';
import { setSettingValueById } from './utils';
import type { BaseTest } from './utils/test';
import { test, expect } from './utils/test';
import { createTestUser, loginTestUser, type ITestUser } from './utils/user-helpers';

test.describe('Delete Own Account', () => {
	let poAccountProfile: AccountProfile;
	let poLogin: Login;
	let userPage: Page;
	let userToDelete: ITestUser;
	let userWithInvalidPassword: ITestUser;
	let userWithoutPermissions: ITestUser;

	test.beforeAll(async ({ api }) => {
		expect((await setSettingValueById(api, 'Accounts_AllowDeleteOwnAccount', true)).status()).toBe(200);
		userToDelete = await createTestUser(api, { username: 'user-to-delete' });
		userWithInvalidPassword = await createTestUser(api, { username: 'user-with-invalid-password' });
		userWithoutPermissions = await createTestUser(api, { username: 'user-without-permissions' });
	});

	const openProfileAs = async (browser: Browser, api: BaseTest['api'], user: ITestUser) => {
		userPage = await browser.newPage({ storageState: (await loginTestUser(api, user)).state });
		poAccountProfile = new AccountProfile(userPage);
		poLogin = new Login(userPage);
		await poAccountProfile.goto();
	};

	test.afterEach(async () => {
		await userPage?.close();
	});

	test.afterAll(async ({ api }) => {
		expect((await setSettingValueById(api, 'Accounts_AllowDeleteOwnAccount', false)).status()).toBe(200);
		await userWithInvalidPassword.delete();
		await userWithoutPermissions.delete();
	});

	test('should not delete account when invalid password is provided', async ({ browser, api }) => {
		await openProfileAs(browser, api, userWithInvalidPassword);

		await test.step('locate Delete My Account button', async () => {
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
			await expect(poAccountProfile.profileHeading).toBeVisible();
		});
	});

	test('should delete account when valid password is provided and permission is enabled', async ({ browser, api }) => {
		await openProfileAs(browser, api, userToDelete);

		await test.step('locate Delete My Account button', async () => {
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

		test('should not show delete account button when permission is disabled', async ({ browser, api }) => {
			await openProfileAs(browser, api, userWithoutPermissions);

			await test.step('locate Delete My Account button', async () => {
				await expect(poAccountProfile.btnDeleteMyAccount).not.toBeVisible();
			});
		});
	});
});
