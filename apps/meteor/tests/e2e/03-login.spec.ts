import { test, expect } from '@playwright/test';

import { validUser } from './utils/mocks/userAndPasswordMock';
import LoginPage from './utils/pageobjects/LoginPage';
import { HOME_SELECTOR } from './utils/mocks/waitSelectorsMock';

test.describe('[Login]', () => {
	let loginPage: LoginPage;

	test.beforeEach(async ({ page, baseURL }) => {
		const baseUrl = baseURL;
		loginPage = new LoginPage(page);
		await loginPage.goto(baseUrl as string);
	});

	test('expect user write a password incorrectly', async () => {
		const invalidUserPassword = {
			email: validUser.email,
			password: 'any_password1',
		};
		await loginPage.login(invalidUserPassword);
		await expect(loginPage.getToastError()).toBeVisible();
	});

	test('expect user make login', async () => {
		await loginPage.login(validUser);
		await loginPage.waitForSelector(HOME_SELECTOR);
	});
});
