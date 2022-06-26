import { test, expect } from '@playwright/test';

import { validUser } from './utils/mocks/userAndPasswordMock';
import { Global, LoginPage } from './pageobjects';
import { HOME_SELECTOR } from './utils/mocks/waitSelectorsMock';

test.describe('[Login]', () => {
	let loginPage: LoginPage;
	let global: Global;

	test.beforeEach(async ({ page }) => {
		loginPage = new LoginPage(page);
		global = new Global(page);
		await page.goto('/');
	});

	test('expect user write a password incorrectly', async () => {
		const invalidUserPassword = {
			email: validUser.email,
			password: 'any_password1',
		};
		await loginPage.doLogin(invalidUserPassword, false);
		await expect(global.getToastBarError).toBeVisible();
	});

	test('expect user make login', async () => {
		await loginPage.doLogin(validUser);
		await loginPage.waitForSelector(HOME_SELECTOR);
	});
});
