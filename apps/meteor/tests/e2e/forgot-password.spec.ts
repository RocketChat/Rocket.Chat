import { test, expect } from '@playwright/test';

import { Auth } from './page-objects';

test.describe.parallel('forgot-password', () => {
	let pageAuth: Auth;

	test.beforeEach(async ({ page }) => {
		pageAuth = new Auth(page);
		
		await page.goto('/');
	});

	test('expect trigger a validation error if no email is provided', async () => {
		await pageAuth.btnForgotPassword.click();
		await pageAuth.btnSubmit.click();

		await expect(pageAuth.textErrorEmail).toBeVisible();
	});

	test('expect trigger a validation if a invalid email is provided', async () => {
		await pageAuth.btnForgotPassword.click();
		await pageAuth.inputEmail.type('mail@mail');
		await pageAuth.btnSubmit.click();

		await expect(pageAuth.textErrorEmail).toBeVisible();
	});

	test('expect to show a success toast if a valid email is provided', async () => {
		await pageAuth.btnForgotPassword.click();
		await pageAuth.inputEmail.type('mail@mail.com');
		await pageAuth.btnSubmit.click();

		await expect(pageAuth.toastSuccess).toBeVisible();
	});
});
