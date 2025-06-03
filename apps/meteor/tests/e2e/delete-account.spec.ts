import { faker } from '@faker-js/faker';
import type { IUser } from '@rocket.chat/core-typings';

import { DEFAULT_USER_CREDENTIALS } from './config/constants';
import { Users } from './fixtures/userStates';
import { AccountProfile, Registration } from './page-objects';
import { test, expect } from './utils/test';

test.use({ storageState: Users.admin.state });

test.describe('Delete My Account', () => {
	let poAccountProfile: AccountProfile;
	let createUserToDelete: IUser;
	let poRegistration: Registration;

	test.beforeAll(async ({ page, api }) => {
		await api.post('/settings/Accounts_AllowDeleteOwnAccount', { value: true });

		poAccountProfile = new AccountProfile(page);
		poRegistration = new Registration(page);

		await page.goto('/account/profile');
		await poAccountProfile.profileTitle.waitFor({ state: 'visible' });

		const createUserToDeleteResponse = await api.post('/users.create', {
			email: faker.internet.email(),
			name: faker.person.fullName(),
			password: DEFAULT_USER_CREDENTIALS.password,
			username: 'user-to-delete',
		});
		createUserToDelete = (await createUserToDeleteResponse.json()).user;
	});

	test.afterAll(async ({ api }) => {
		await api.post('/settings/Accounts_AllowDeleteOwnAccount', { value: false });
		await api.post('/users.delete', { userId: createUserToDelete._id }).catch((error) => {
			console.error(error);
		});
	});

	test.fail('should be able to delete own account', async () => {
		await test.step('login with the user to delete', async () => {
			await poRegistration.username.type('user-to-delete');
			await poRegistration.inputPassword.type(DEFAULT_USER_CREDENTIALS.password);
			await poRegistration.btnLogin.click();
		});

		await test.step('navigate to profile and locate Delete My Account button', async () => {
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
