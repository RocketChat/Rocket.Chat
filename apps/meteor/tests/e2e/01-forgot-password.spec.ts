import { test, expect } from '@playwright/test';

import LoginPage from './utils/pageobjects/LoginPage';
import { VALID_EMAIL, INVALID_EMAIL, INVALID_EMAIL_WITHOUT_MAIL_PROVIDER } from './utils/mocks/userAndPasswordMock';

test.describe('[Forgot Password]', () => {
	let loginPage: LoginPage;

	test.beforeEach(async ({ page, baseURL }) => {
		loginPage = new LoginPage(page);
		const baseUrl = baseURL as string;
		await loginPage.goto(baseUrl);
		await loginPage.gotToForgotPassword();
	});

	test('expect be required', async () => {
		loginPage.submit();

		await expect(loginPage.emailInvalidText()).toBeVisible();
	});

	test('expect invalid for email without domain', async () => {
		await loginPage.emailField().type(INVALID_EMAIL_WITHOUT_MAIL_PROVIDER);
		await loginPage.submit();
		await expect(loginPage.emailInvalidText()).toBeVisible();
	});

	test('expect be invalid for email with invalid domain', async () => {
		await loginPage.emailField().type(INVALID_EMAIL);
		await loginPage.submit();
		await expect(loginPage.emailInvalidText()).toBeVisible();
	});

	test('expect user type a valid email', async () => {
		await loginPage.emailField().type(VALID_EMAIL);
		await loginPage.submit();
		await expect(loginPage.getToastMessageSuccess()).toBeVisible();
	});
});
