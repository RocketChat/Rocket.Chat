import { faker } from '@faker-js/faker';

import { DEFAULT_USER_CREDENTIALS } from './config/constants';
import { Registration } from './page-objects';
import { HomeSidenav } from './page-objects/fragments/home-sidenav';
import { setSettingValueById } from './utils/setSettingValueById';
import { test, expect } from './utils/test';
import type { ITestUser } from './utils/user-helpers';
import { createTestUser } from './utils/user-helpers';

test.describe.parallel('Required Password Change', () => {
	let poRegistration: Registration;
	let poSidenav: HomeSidenav;
	let testUser: ITestUser;

	test.beforeAll(async ({ api }) => {
		await setSettingValueById(api, 'Accounts_RequirePasswordConfirmation', true);
		testUser = await createTestUser(api, { data: { requirePasswordChange: true } });
	});

	test.beforeEach(async ({ page }) => {
		poRegistration = new Registration(page);
		poSidenav = new HomeSidenav(page);
	});

	test.afterAll(async ({ api }) => {
		await Promise.all([setSettingValueById(api, 'Accounts_RequirePasswordConfirmation', true), testUser.delete()]);
	});

	test.fail('should redirect to home after successful password change for new user', async ({ page }) => {
		await test.step('login with temporary password', async () => {
			await page.goto('/login');
			await poRegistration.username.fill(testUser.data.username);
			await poRegistration.inputPassword.fill(DEFAULT_USER_CREDENTIALS.password);
			await poRegistration.btnLogin.click();
		});

		await test.step('should be redirected to password change screen', async () => {
			await expect(poRegistration.inputPassword).toBeVisible();
			await expect(poRegistration.inputPasswordConfirm).toBeVisible();
		});

		await test.step('enter new password and confirm', async () => {
			const newPassword = faker.internet.password({ length: 5 });
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
			await expect(poSidenav.sidebarChannelsList).toBeVisible();
			await expect(poSidenav.userProfileMenu).toBeVisible();
		});
	});
});
