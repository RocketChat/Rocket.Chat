import { faker } from '@faker-js/faker';

import { test, expect } from './utils/test';
import { Auth } from './page-objects';

test.describe.parallel('register-and-login', () => {
	let poAuth: Auth;

	test.beforeEach(async ({ page }) => {
		poAuth = new Auth(page);

		await page.goto('/home');
	});

	test('expect trigger a validation error if no data is provided on register', async () => {
		await poAuth.btnRegister.click();
		await poAuth.btnSubmit.click();

		await expect(poAuth.textErrorName).toBeVisible();
		await expect(poAuth.textErrorEmail).toBeVisible();
		await expect(poAuth.textErrorPassword).toBeVisible();
	});

	test('expect trigger a validation error if different password is provided on register', async () => {
		await poAuth.btnRegister.click();
		await poAuth.inputName.type(faker.name.firstName());
		await poAuth.inputEmail.type(faker.internet.email());
		await poAuth.inputPassword.type('any_password');
		await poAuth.inputPasswordConfirm.type('any_password_2');
		await poAuth.btnSubmit.click();

		await expect(poAuth.textErrorPasswordConfirm).toBeVisible();
	});

	test('expect successfully register a new user', async () => {
		await poAuth.btnRegister.click();
		await poAuth.inputName.type(faker.name.firstName());
		await poAuth.inputEmail.type(faker.internet.email());
		await poAuth.inputPassword.type('any_password');
		await poAuth.inputPasswordConfirm.type('any_password');
		await poAuth.btnSubmit.click();
		await poAuth.btnRegisterConfirmUsername.click();
	});

	test('expect show a toast when wrong username/password on login', async () => {
		await poAuth.inputEmailOrUsername.type(faker.internet.email());
		await poAuth.inputPassword.type('any_password');
		await poAuth.btnSubmit.click();

		await expect(poAuth.toastError).toBeVisible();
	});
});
