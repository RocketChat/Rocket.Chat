import { Page, test, expect } from '@playwright/test';

import { Auth } from './page-objects';

test.describe('Forgot Password', () => {
	let page: Page;
	let pageAuth: Auth;

	test.beforeAll(async ({ browser }) => {
		page = await browser.newPage();
		pageAuth = new Auth(page);
	});

<<<<<<< HEAD
	test('expect trigger a validation error if no email is provided', async () => {
		await page.goto('/');
		await pageAuth.btnForgotPassword.click();

=======
	test.beforeEach(async () => {
		await page.goto('/');
		await pageAuth.btnForgotPassword.click();
	});

	test('expect trigger a validation error if no email is provided', async () => {
>>>>>>> feat: add locators, actions and update tests
		await pageAuth.btnSubmit.click();

		await expect(pageAuth.textErrorEmail).toBeVisible();
	});

	test('expect trigger a validation if a invalid email is provided (1)', async () => {
<<<<<<< HEAD
		await page.goto('/');
		await pageAuth.btnForgotPassword.click();

=======
>>>>>>> feat: add locators, actions and update tests
		await pageAuth.inputEmail.type('mail');
		await pageAuth.btnSubmit.click();

		await expect(pageAuth.textErrorEmail).toBeVisible();
	});

	test('expect trigger a validation if a invalid email is provided (2)', async () => {
<<<<<<< HEAD
		await page.goto('/');
		await pageAuth.btnForgotPassword.click();

=======
>>>>>>> feat: add locators, actions and update tests
		await pageAuth.inputEmail.type('mail@mail');
		await pageAuth.btnSubmit.click();

		await expect(pageAuth.textErrorEmail).toBeVisible();
	});

	test('expect to show a success toast if a valid email is provided', async () => {
<<<<<<< HEAD
		await page.goto('/');
		await pageAuth.btnForgotPassword.click();

=======
>>>>>>> feat: add locators, actions and update tests
		await pageAuth.inputEmail.type('mail@mail.com');
		await pageAuth.btnSubmit.click();

		await expect(pageAuth.toastSuccess).toBeVisible();
	});
});
