import { test, expect } from '@playwright/test';

import LoginPage from './utils/pageobjects/login.page';

test.describe('recoverPassword', () => {
	let loginPage: LoginPage;
	test.beforeAll(async ({ browser, baseURL }) => {
		loginPage = new LoginPage(browser, baseURL as string);
		await loginPage.open();
	});

	test.beforeEach(async () => {
		await loginPage.goto('');
		await loginPage.gotToForgotPassword();
	});

	test('expect be required', async () => {
		loginPage.submit();
		// loginPage.emailField.should('have.class', 'error');
		await expect(loginPage.emailInvalidText()).toBeVisible();
	});

	test('expect invalid for email without domain', async () => {
		const emailField = loginPage.emailField();
		await emailField.type('invalidmail');
		await loginPage.submit();
		// loginPage.emailField.should('have.class', 'error');
		await expect(loginPage.emailInvalidText()).toBeVisible();
	});

	test('expect be invalid for email with invalid domain', async () => {
		const emailField = loginPage.emailField();
		await emailField.type('email@mail');
		await loginPage.submit();
		await expect(loginPage.emailInvalidText()).toBeVisible();
	});

	test('expect user type a valid email', async () => {
		const emailField = loginPage.emailField();
		await emailField.type('any_user@gmail.com');
		await loginPage.submit();
		const toastMessageSuccess = loginPage.getToastMessageSuccess();
		await expect(toastMessageSuccess).toBeVisible();
	});
});
