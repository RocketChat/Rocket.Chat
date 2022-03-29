import { test, expect } from '@playwright/test';

import { validUser } from './utils/mocks/userAndPasswordMock';
import LoginPage from './utils/pageobjects/login.page';

test.describe('[Login]', () => {
	let loginPage: LoginPage;
	test.beforeEach(async ({ browser, baseURL }) => {
		loginPage = new LoginPage(browser, baseURL as string);
		await loginPage.open();
	});

	test('expect user make login', async () => {
		await loginPage.login(validUser);
		await expect(loginPage.getHomeMessage()).toContainText('Home');
	});

	test('expect user write a password incorrectly', async () => {
		const invalidUserPassword = {
			email: validUser.email,
			password: 'any_password1',
		};
		await loginPage.login(invalidUserPassword);
		const toastError = loginPage.getToastError();
		await expect(toastError).toBeVisible();
		await expect(toastError).toHaveText('User not found or incorrect password');
	});
});
