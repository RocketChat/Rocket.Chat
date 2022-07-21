import { Page, test, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';

import { Auth } from './page-objects';

test.describe('Register', () => {
	let page: Page;
	let pageAuth: Auth;

	test.beforeAll(async ({ browser }) => {
		page = await browser.newPage();
		pageAuth = new Auth(page);
	});

	test.beforeEach(async () => {
		await page.goto('/');
		await pageAuth.btnRegister.click();
	});

	test('expect trigger a validation error if no data is provided', async () => {
		await pageAuth.btnSubmit.click();

		await expect(pageAuth.textErrorName).toBeVisible();
		await expect(pageAuth.textErrorEmail).toBeVisible();
		await expect(pageAuth.textErrorPassword).toBeVisible();
	});

	test('expect trigger a validation error if different password is provided', async () => {
		await pageAuth.inputName.type(faker.name.firstName());
		await pageAuth.inputEmail.type(faker.internet.email());
		await pageAuth.inputPassword.type('any_password');
		await pageAuth.inputPasswordConfirm.type('any_password_2');
		await pageAuth.btnSubmit.click();

		await expect(pageAuth.textErrorPasswordConfirm).toBeVisible();
	});

	test('expect successfully register a new user', async () => {
		await pageAuth.inputName.type(faker.name.firstName());
		await pageAuth.inputEmail.type(faker.internet.email());
		await pageAuth.inputPassword.type('any_password');
		await pageAuth.inputPasswordConfirm.type('any_password');
		await pageAuth.btnSubmit.click();
		await pageAuth.btnRegisterConfirmUsername.click();
	});
});
