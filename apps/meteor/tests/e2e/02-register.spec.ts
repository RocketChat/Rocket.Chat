import { test, expect } from '@playwright/test';

import { registerUser } from './utils/mocks/userAndPasswordMock';
import { Login } from './pageobjects';

test.describe('[Register]', () => {
	let login: Login;

	test.beforeEach(async ({ page }) => {
		login = new Login(page);
		await page.goto('/');
	});

	test('expect user click in register button without data', async () => {
		await login.btnRegister.click();
		await login.btnSubmit.click();

		await expect(login.nameInvalidText).toBeVisible();
		await expect(login.emailInvalidText).toBeVisible();
		await expect(login.passwordInvalidText).toBeVisible();
	});

	test('expect user click in register button with different password', async () => {
		await login.btnRegister.click();
		await login.passwordField.type(registerUser.password);
		await login.emailField.type(registerUser.email);
		await login.nameField.type(registerUser.name);
		await login.confirmPasswordField.type('wrong_password');

		await login.btnSubmit.click();
		await expect(login.confirmPasswordInvalidText).toBeVisible();
		await expect(login.confirmPasswordInvalidText).toHaveText('The password confirmation does not match password');
	});

	test('expect new user is created', async () => {
		await login.btnRegister.click();
		await login.registerNewUser(registerUser);
	});
});
