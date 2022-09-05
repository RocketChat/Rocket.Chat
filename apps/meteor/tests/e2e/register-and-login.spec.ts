import { faker } from '@faker-js/faker';

import { test, expect } from './utils/test';
import { Registration } from './page-objects';

test.describe.parallel.only('register-and-login', () => {
	let poRegistration: Registration;

	test.beforeEach(async ({ page }) => {
		poRegistration = new Registration(page);

		await page.goto('/home');
		await poRegistration.goToRegister.click();
	});

	test('Registration', async () => {
		await test.step('expect trigger a validation error if no data is provided on register', async () => {
			await poRegistration.btnRegister.click();

			await expect(poRegistration.inputName).toBeInvalid();
			await expect(poRegistration.inputEmail).toBeInvalid();
			await expect(poRegistration.inputPassword).toBeInvalid();
			await expect(poRegistration.username).toBeInvalid();
		});

		await test.step('expect trigger a validation error if different password is provided on register', async () => {
			await poRegistration.inputName.fill(faker.name.firstName());
			await poRegistration.inputEmail.fill(faker.internet.email());
			await poRegistration.username.fill(faker.internet.userName());
			await poRegistration.inputPassword.fill('any_password');
			await poRegistration.inputPasswordConfirm.fill('any_password_2');
			await poRegistration.btnRegister.click();

			await expect(poRegistration.inputPasswordConfirm).toBeInvalid();
		});

		await test.step('expect successfully register a new user', async () => {
			await poRegistration.inputPasswordConfirm.fill('any_password');
			await poRegistration.btnRegister.click();
			await expect(poRegistration.backToLogin).not.toBeVisible();
		});
	});
});

test.describe.parallel.only('register-and-login', () => {
	let poRegistration: Registration;

	test.beforeEach(async ({ page }) => {
		poRegistration = new Registration(page);

		await page.goto('/home');
	});

	test('Login', async () => {
		await test.step('expect show a toast when wrong username/password on login', async () => {
			await poRegistration.username.type(faker.internet.email());
			await poRegistration.inputPassword.type('any_password');
			await poRegistration.btnLogin.click();

			await expect(poRegistration.username).toBeInvalid();
			await expect(poRegistration.inputPassword).toBeInvalid();
		});
	});
});
