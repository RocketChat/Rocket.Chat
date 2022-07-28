import { test, expect } from '@playwright/test';

import { Auth } from './page-objects';

test.describe.parallel('forgot-password', () => {
	let poAuth: Auth;

	test.beforeEach(async ({ page }) => {
		poAuth = new Auth(page);

		await page.goto('/home');
	});

	test('expect trigger a validation error if no email is provided', async () => {
		await poAuth.btnForgotPassword.click();
		await poAuth.btnSubmit.click();

		await expect(poAuth.textErrorEmail).toBeVisible();
	});

	test('expect trigger a validation if a invalid email is provided', async () => {
		await poAuth.btnForgotPassword.click();
		await poAuth.inputEmail.type('mail@mail');
		await poAuth.btnSubmit.click();

		await expect(poAuth.textErrorEmail).toBeVisible();
	});

	test('expect to show a success toast if a valid email is provided', async () => {
		await poAuth.btnForgotPassword.click();
		await poAuth.inputEmail.type('mail@mail.com');
		await poAuth.btnSubmit.click();

		await expect(poAuth.toastSuccess).toBeVisible();
	});
});
