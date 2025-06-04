import { faker } from '@faker-js/faker';
import type { IUser } from '@rocket.chat/core-typings';

import { DEFAULT_USER_CREDENTIALS } from './config/constants';
import { AccountProfile, Registration, Utils } from './page-objects';
import { test, expect } from './utils/test';

test.describe('User can delete own account when permission is enabled', () => {
	let poAccountProfile: AccountProfile;
	let poRegistration: Registration;
	let poUtils: Utils;
	let userToDelete: IUser & { username: string };

	test.beforeAll(async ({ api }) => {
		await api.post('/settings/Accounts_AllowDeleteOwnAccount', { value: true });

		const response = await api.post('/users.create', {
			email: faker.internet.email(),
			name: faker.person.fullName(),
			password: DEFAULT_USER_CREDENTIALS.password,
			username: 'user-to-delete',
		});
		expect(response.status()).toBe(200);
		const json = await response.json();
		userToDelete = json.user;
	});

	test.beforeEach(async ({ page }) => {
		poAccountProfile = new AccountProfile(page);
		poRegistration = new Registration(page);
		poUtils = new Utils(page);
		await page.goto('/home');
	});

	test.afterAll(async ({ api }) => {
		await Promise.all([
			api.post('/settings/Accounts_AllowDeleteOwnAccount', { value: false }),
			api.post('/users.delete', { userId: userToDelete._id }).catch((error) => {
				console.error(error);
			}),
		]);
	});

	test('should not be able to delete own account with invalid username', async ({ page }) => {
		await test.step('login with the user to delete', async () => {
			await poRegistration.username.type('user-to-delete');
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
			await poAccountProfile.deleteAccountUsernameInput.fill('invalid-username');
			await expect(poAccountProfile.deleteAccountUsernameInput).toHaveValue('invalid-username');
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
	test.fail('should be able to delete own account with valid username', async ({ page }) => {
		await test.step('login with the user to delete', async () => {
			await poRegistration.username.type('user-to-delete');
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
			await expect(poAccountProfile.deleteAccountUsernameInput).toBeVisible();
			await expect(poAccountProfile.btnDeleteAccountConfirm).toBeVisible();
			await expect(poAccountProfile.btnDeleteAccountCancel).toBeVisible();
		});

		await test.step('enter username in the confirmation field and click delete account', async () => {
			await poAccountProfile.deleteAccountUsernameInput.fill('user-to-delete');
			await expect(poAccountProfile.deleteAccountUsernameInput).toHaveValue('user-to-delete');
			await poAccountProfile.btnDeleteAccountConfirm.click();
		});

		await test.step('verify user is redirected to login page', async () => {
			await expect(poRegistration.btnLogin).toBeVisible();
		});
	});
});

test.describe('User can not delete own account when permission is disabled', () => {
	let poAccountProfile: AccountProfile;
	let poRegistration: Registration;
	let poUtils: Utils;
	let userToDelete: IUser & { username: string };

	test.beforeAll(async ({ api }) => {
		await api.post('/settings/Accounts_AllowDeleteOwnAccount', { value: false });
		const response = await api.post('/users.create', {
			email: faker.internet.email(),
			name: faker.person.fullName(),
			password: DEFAULT_USER_CREDENTIALS.password,
			username: 'user-to-delete',
		});
		expect(response.status()).toBe(200);
		const json = await response.json();
		userToDelete = json.user;
	});
	test.beforeEach(async ({ page }) => {
		poAccountProfile = new AccountProfile(page);
		poRegistration = new Registration(page);
		poUtils = new Utils(page);
		await page.goto('/home');
	});

	test.afterAll(async ({ api }) => {
		await api.post('/settings/Accounts_AllowDeleteOwnAccount', { value: false });
		await api.post('/users.delete', { userId: userToDelete._id }).catch((error) => {
			console.error(error);
		});
	});

	test('should not be able to delete own account', async ({ page }) => {
		await test.step('login with the user to delete', async () => {
			await poRegistration.username.type('user-to-delete');
			await poRegistration.inputPassword.type(DEFAULT_USER_CREDENTIALS.password);
			await poRegistration.btnLogin.click();
			await expect(poUtils.mainContent).toBeVisible();
		});

		await test.step('should not be able to see the Delete My Account button', async () => {
			await page.goto('/account/profile');
			await poAccountProfile.profileTitle.waitFor({ state: 'visible' });
			await expect(poAccountProfile.btnDeleteMyAccount).not.toBeVisible();
		});
	});
});
