import { test, expect } from '@playwright/test';

import { Global, LoginPage } from './pageobjects';

test.describe('[Forgot Password]', () => {
	let loginPage: LoginPage;
	let global: Global;

	test.beforeEach(async ({ page }) => {
		loginPage = new LoginPage(page);
		global = new Global(page);

		await page.goto('/');
		await loginPage.btnForgotPassword.click();
	});

	test('expect be required', async () => {
		loginPage.btnSubmit.click();

		await expect(loginPage.emailInvalidText).toBeVisible();
	});

	test('expect invalid for email without domain', async () => {
		await loginPage.emailField.type('mail');
		await loginPage.btnSubmit.click();
		await expect(loginPage.emailInvalidText).toBeVisible();
	});

	test('expect be invalid for email with invalid domain', async () => {
		await loginPage.emailField.type('mail@mail');
		await loginPage.btnSubmit.click();
		await expect(loginPage.emailInvalidText).toBeVisible();
	});

	test('expect user type a valid email', async () => {
		await loginPage.emailField.type('mail@mail.com');
		await loginPage.btnSubmit.click();
		await expect(global.getToastBarSuccess).toBeVisible();
	});
});
