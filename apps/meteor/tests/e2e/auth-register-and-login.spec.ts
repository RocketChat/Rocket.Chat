import { Page, test, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';

import { Auth } from './page-objects';

test.describe('Register and Login', () => {
	let page: Page;
	let pageAuth: Auth;

	test.beforeAll(async ({ browser }) => {
		page = await browser.newPage();
		pageAuth = new Auth(page);
	});

	test.describe('Login', () => {
		test('expect to show a toast if the provided password is incorrect', async () => {
			await page.goto('/');
			
			await pageAuth.inputEmailOrUsername.type(faker.internet.email());
			await pageAuth.inputPassword.type('any_password');
			await pageAuth.btnSubmit.click();

			await expect(pageAuth.toastError).toBeVisible();
		});
	});

	test.describe('Register New User', () => {
		test('expect trigger a validation error if no data is provided', async () => {
			await page.goto('/');
			await pageAuth.btnRegister.click();

			await pageAuth.btnSubmit.click();

			await expect(pageAuth.textErrorName).toBeVisible();
			await expect(pageAuth.textErrorEmail).toBeVisible();
			await expect(pageAuth.textErrorPassword).toBeVisible();
			// await expect(pageAuth.textErrorPasswordConfirm).toBeVisible();
		});

		test('expect trigger a validation error if different password is provided', async () => {
			await page.goto('/');
			await pageAuth.btnRegister.click();

			await pageAuth.inputName.type(faker.name.firstName());
			await pageAuth.inputEmail.type(faker.internet.email());
			await pageAuth.inputPassword.type('any_password');
			await pageAuth.inputPasswordConfirm.type('any_password_2');
			await pageAuth.btnSubmit.click();

			await expect(pageAuth.textErrorPasswordConfirm).toBeVisible();
		});

		test('expect create a new user', async () => {
			await page.goto('/');
			await pageAuth.btnRegister.click();

			await pageAuth.inputName.type(faker.name.firstName());
			await pageAuth.inputEmail.type(faker.internet.email());
			await pageAuth.inputPassword.type('any_password');
			await pageAuth.inputPasswordConfirm.type('any_password');
			await pageAuth.btnSubmit.click();
			await pageAuth.btnRegisterConfirmUsername.click();
		});
	});
});
