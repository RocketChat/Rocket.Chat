import { test, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';

import { Auth } from './page-objects';

test.describe.parallel('register-and-login', () => {
    let pageAuth: Auth;

	test.beforeEach(async ({ page }) => {
		pageAuth = new Auth(page);
        
        await page.goto('/');
	});

	test('expect trigger a validation error if no data is provided on register', async () => {
        await pageAuth.btnRegister.click();
		await pageAuth.btnSubmit.click();

		await expect(pageAuth.textErrorName).toBeVisible();
		await expect(pageAuth.textErrorEmail).toBeVisible();
		await expect(pageAuth.textErrorPassword).toBeVisible();
	});

	test('expect trigger a validation error if different password is provided on register', async () => {
        await pageAuth.btnRegister.click();
        await pageAuth.inputName.type(faker.name.firstName());
		await pageAuth.inputEmail.type(faker.internet.email());
		await pageAuth.inputPassword.type('any_password');
		await pageAuth.inputPasswordConfirm.type('any_password_2');
		await pageAuth.btnSubmit.click();

		await expect(pageAuth.textErrorPasswordConfirm).toBeVisible();
	});

	test('expect successfully register a new user', async () => {
        await pageAuth.btnRegister.click();
        await pageAuth.inputName.type(faker.name.firstName());
		await pageAuth.inputEmail.type(faker.internet.email());
		await pageAuth.inputPassword.type('any_password');
		await pageAuth.inputPasswordConfirm.type('any_password');
		await pageAuth.btnSubmit.click();
		await pageAuth.btnRegisterConfirmUsername.click();
	});

    test('expect show a toast when wrong username/password on login', async () => {
		await pageAuth.inputEmailOrUsername.type(faker.internet.email());
		await pageAuth.inputPassword.type('any_password');
		await pageAuth.btnSubmit.click();

		await expect(pageAuth.toastError).toBeVisible();
	});
});
