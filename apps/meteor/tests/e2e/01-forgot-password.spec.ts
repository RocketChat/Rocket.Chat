import { Page, test, expect } from '@playwright/test';

import { Auth } from './page-objects';

test.describe('Forgot Password', () => {
	let pageTestContext: Page;
	let pageAuth: Auth;

	test.beforeEach(async ({ page }) => {
		pageTestContext = page;
		pageAuth = new Auth(page);
	});

	test.beforeEach(async () => {
		await pageTestContext.goto('/');
		await pageAuth.btnForgotPassword.click();
	});

	test('expect trigger a validation error if no email is provided', async () => {
		await pageAuth.btnSubmit.click();

		await expect(pageAuth.textErrorEmail).toBeVisible();
	});

	test('expect trigger a validation if a invalid email is provided (1)', async () => {
		await pageAuth.inputEmail.type('mail');
		await pageAuth.btnSubmit.click();

		await expect(pageAuth.textErrorEmail).toBeVisible();
	});

	test('expect trigger a validation if a invalid email is provided (2)', async () => {
		await pageAuth.inputEmail.type('mail@mail');
		await pageAuth.btnSubmit.click();

		await expect(pageAuth.textErrorEmail).toBeVisible();
	});

	test('expect to show a success toast if a valid email is provided', async () => {
		await pageAuth.inputEmail.type('mail@mail.com');
		await pageAuth.btnSubmit.click();

		await expect(pageAuth.toastSuccess).toBeVisible();
	});
});
