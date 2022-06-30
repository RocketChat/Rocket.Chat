import { test, expect } from '@playwright/test';

import { Global, Login } from './pageobjects';

test.describe('[Forgot Password]', () => {
	let login: Login;
	let global: Global;

	test.beforeEach(async ({ page }) => {
		login = new Login(page);
		global = new Global(page);

		await page.goto('/');
		await login.btnForgotPassword.click();
	});

	test('expect invalid for email without domain', async () => {
		await login.emailField.type('mail');
		await login.btnSubmit.click();
		await expect(login.emailInvalidText).toBeVisible();
	});

	test('expect be invalid for email with invalid domain', async () => {
		await login.emailField.type('mail@mail');
		await login.btnSubmit.click();
		await expect(login.emailInvalidText).toBeVisible();
	});

	test('expect user type a valid email', async () => {
		await login.emailField.type('mail@mail.com');
		await login.btnSubmit.click();
		await expect(global.getToastBarSuccess).toBeVisible();
	});
});
