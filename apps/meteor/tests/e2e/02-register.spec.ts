import { test } from '@playwright/test';

import { registerUser, WRONG_PASSWORD } from './utils/mocks/userAndPasswordMock';
import LoginPage from './utils/pageobjects/LoginPage';

test.describe('[Register]', () => {
	let loginPage: LoginPage;

	test.beforeEach(async ({ page, baseURL }) => {
		const URL = baseURL as string;
		loginPage = new LoginPage(page);
		await loginPage.goto(URL);
	});

	test('expect user click in register button without data', async () => {
		await loginPage.registerFail();
	});

	test('expect user click in register button with different password', async () => {
		await loginPage.registerFailWithDifferentPassword(registerUser, WRONG_PASSWORD);
	});

	test('expect new user is created', async () => {
		await loginPage.gotToRegister();
		await loginPage.registerNewUser(registerUser);
	});
});
