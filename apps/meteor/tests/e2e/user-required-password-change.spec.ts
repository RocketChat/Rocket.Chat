import { faker } from '@faker-js/faker';

import { DEFAULT_USER_CREDENTIALS } from './config/constants';
import { Registration } from './page-objects';
import { HomeSidenav } from './page-objects/fragments/home-sidenav';
import { getSettingValueById, setSettingValueById } from './utils';
import { test, expect } from './utils/test';
import type { ITestUser } from './utils/user-helpers';
import { createTestUser } from './utils/user-helpers';

test.describe('User - Password change required', () => {
	let poRegistration: Registration;
	let poSidenav: HomeSidenav;
	let userRequiringPasswordChange: ITestUser;
	let userNotRequiringPasswordChange: ITestUser;
	let userNotAbleToLogin: ITestUser;
	let settingDefaultValue: unknown;

	test.beforeAll(async ({ api }) => {
		settingDefaultValue = await getSettingValueById(api, 'Accounts_RequirePasswordConfirmation');
		await setSettingValueById(api, 'Accounts_RequirePasswordConfirmation', true);
		userRequiringPasswordChange = await createTestUser(api, { data: { requirePasswordChange: true } });
		userNotRequiringPasswordChange = await createTestUser(api, { data: { requirePasswordChange: false } });
		userNotAbleToLogin = await createTestUser(api, { data: { requirePasswordChange: true } });
	});

	test.beforeEach(async ({ page }) => {
		poRegistration = new Registration(page);
		poSidenav = new HomeSidenav(page);
		await page.goto('/home');
	});

	test.afterAll(async ({ api }) => {
		await Promise.all([
			setSettingValueById(api, 'Accounts_RequirePasswordConfirmation', settingDefaultValue),
			userRequiringPasswordChange.delete(),
			userNotRequiringPasswordChange.delete(),
			userNotAbleToLogin.delete(),
		]);
	});

	test.fail('should redirect to home after successful password change for new user', async ({ page }) => {
		await test.step('login with temporary password', async () => {
			await poRegistration.username.fill(userRequiringPasswordChange.data.username);
			await poRegistration.inputPassword.fill(DEFAULT_USER_CREDENTIALS.password);
			await poRegistration.btnLogin.click();
		});

		await test.step('should be redirected to password change screen', async () => {
			await expect(poRegistration.inputPassword).toBeVisible();
			await expect(poRegistration.inputPasswordConfirm).toBeVisible();
		});

		await test.step('enter new password and confirm', async () => {
			const newPassword = faker.internet.password();
			await poRegistration.inputPassword.fill(newPassword);
			await poRegistration.inputPasswordConfirm.fill(newPassword);
		});

		await test.step('click reset button', async () => {
			await poRegistration.btnReset.click();
		});

		await test.step('verify password reset form is not visible', async () => {
			await page.waitForURL('/home');
			await expect(poRegistration.inputPassword).not.toBeVisible();
			await expect(poRegistration.inputPasswordConfirm).not.toBeVisible();
		});

		await test.step('verify user is properly logged in', async () => {
			await expect(poSidenav.userProfileMenu).toBeVisible();
			await expect(poSidenav.sidebarChannelsList).toBeVisible();
		});
	});

	test('should show error when password confirmation does not match', async () => {
		await test.step('login with temporary password', async () => {
			await poRegistration.username.fill(userNotAbleToLogin.data.username);
			await poRegistration.inputPassword.fill(DEFAULT_USER_CREDENTIALS.password);
			await poRegistration.btnLogin.click();
		});

		await test.step('should be redirected to password change screen', async () => {
			await expect(poRegistration.inputPassword).toBeVisible();
			await expect(poRegistration.inputPasswordConfirm).toBeVisible();
		});

		await test.step('enter different passwords in password and confirm fields', async () => {
			await poRegistration.inputPassword.fill(DEFAULT_USER_CREDENTIALS.password);
			await poRegistration.inputPasswordConfirm.fill(faker.internet.password());
		});

		await test.step('attempt to submit password change', async () => {
			await poRegistration.btnReset.click();
		});

		await test.step('verify error message appears for password mismatch', async () => {
			await expect(poRegistration.inputPasswordConfirm).toBeInvalid();
		});
	});

	test('should show error when user tries to use the same password as current', async () => {
		await test.step('login with temporary password', async () => {
			await poRegistration.username.fill(userNotAbleToLogin.data.username);
			await poRegistration.inputPassword.fill(DEFAULT_USER_CREDENTIALS.password);
			await poRegistration.btnLogin.click();
		});

		await test.step('should be redirected to password change screen', async () => {
			await expect(poRegistration.inputPassword).toBeVisible();
			await expect(poRegistration.inputPasswordConfirm).toBeVisible();
		});

		await test.step('enter the same password as current password', async () => {
			await poRegistration.inputPassword.fill(DEFAULT_USER_CREDENTIALS.password);
			await poRegistration.inputPasswordConfirm.fill(DEFAULT_USER_CREDENTIALS.password);
		});

		await test.step('attempt to submit password change', async () => {
			await poRegistration.btnReset.click();
		});

		await test.step('verify error message appears for same password', async () => {
			await expect(poRegistration.inputPassword).toBeInvalid();
		});
	});
});

test.describe('User - Password change not required', () => {
	let poRegistration: Registration;
	let poSidenav: HomeSidenav;
	let userNotRequiringPasswordChange: ITestUser;
	let settingDefaultValue: unknown;

	test.beforeAll(async ({ api }) => {
		settingDefaultValue = await getSettingValueById(api, 'Accounts_RequirePasswordConfirmation');
		userNotRequiringPasswordChange = await createTestUser(api, { data: { requirePasswordChange: false } });
	});

	test.beforeEach(async ({ page }) => {
		poRegistration = new Registration(page);
		poSidenav = new HomeSidenav(page);
		await page.goto('/home');
	});

	test.afterAll(async ({ api }) => {
		await Promise.all([
			setSettingValueById(api, 'Accounts_RequirePasswordConfirmation', settingDefaultValue),
			userNotRequiringPasswordChange.delete(),
		]);
	});

	test('should not require password change if the requirePasswordChange is disabled', async ({ page }) => {
		await test.step('login with user not requiring password change', async () => {
			await poRegistration.username.fill(userNotRequiringPasswordChange.data.username);
			await poRegistration.inputPassword.fill(DEFAULT_USER_CREDENTIALS.password);
			await poRegistration.btnLogin.click();
		});

		await test.step('verify user is properly logged in', async () => {
			await page.waitForURL('/home');
			await expect(poSidenav.userProfileMenu).toBeVisible();
			await expect(poSidenav.sidebarChannelsList).toBeVisible();
		});
	});
});
