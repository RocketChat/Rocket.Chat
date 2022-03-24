import { test, expect } from '@playwright/test';

import { incorrectUser, registerUser } from './utils/mocks/userAndPasswordMock';
import LoginPage from './utils/pageobjects/login.page';

// test.describe('[Wizard]', () => {
// 	let loginPage: LoginPage;
// 	test.beforeAll(async ({ browser, baseURL }) => {
// 		loginPage = new LoginPage(browser, baseURL as string);
// 		await loginPage.open();
// 	});
// });
test.describe.configure({ mode: 'parallel' });
test.describe('[Register]', () => {
	let loginPage: LoginPage;
	test.beforeAll(async ({ browser, baseURL }) => {
		loginPage = new LoginPage(browser, baseURL as string);
		await loginPage.open();
	});
	test.beforeEach(async () => {
		await loginPage.goto('');
	});
	test('expect login is failed', async () => {
		await loginPage.login(incorrectUser);
		const toastError = loginPage.getToastError();
		expect(toastError).toBeVisible();
		expect(toastError).toHaveText('User not found or incorrect password');
	});
	// TODO verify register flow
	test('expect new user is created', async () => {
		await loginPage.gotToRegister();
		await loginPage.registerNewUser(registerUser);

		const submitButton = loginPage.registerNextButton();
		await submitButton.click();
		await expect(loginPage.getHomeMessage()).toContainText('Home');
	});

	test('expect when user dont inform user and password error message is showed', async () => {
		await loginPage.submit();
		await expect(loginPage.emailOrUsernameInvalidText()).toHaveText('The email entered is invalid');
		await expect(loginPage.passwordInvalidText()).toHaveText('The password must not be empty');
	});

	test('expect when user dont inform password error message is showed', async () => {
		const emailErrorInput = loginPage.emailOrUsernameField();
		await emailErrorInput.type('any_email@email.com');
		await loginPage.submit();
		expect(loginPage.passwordInvalidText()).toHaveText('The password must not be empty');
	});

	test('expect when user dont inform user error message is showed', async () => {
		const passwordErrorInput = loginPage.passwordField();
		await passwordErrorInput.type('any_password');
		await loginPage.submit();
		await expect(loginPage.emailOrUsernameInvalidText()).toHaveText('The email entered is invalid');
	});

	test('expect user click in register button without data', async () => {
		await loginPage.gotToRegister();
		await loginPage.submit();

		await expect(loginPage.nameInvalidText()).toHaveText('The name must not be empty');
		await expect(loginPage.emailInvalidText()).toHaveText('The email entered is invalid');
		await expect(loginPage.passwordInvalidText()).toHaveText('The password must not be empty');
	});

	test('expect user click in register button email and password', async () => {
		await loginPage.gotToRegister();

		const inputName = loginPage.nameField();
		await inputName.type('any_name');
		await loginPage.submit();
		await expect(loginPage.nameInvalidText()).not.toBeVisible();
		await expect(loginPage.emailInvalidText()).toHaveText('The email entered is invalid');
		await expect(loginPage.passwordInvalidText()).toHaveText('The password must not be empty');
	});

	test('expect user click in register button withoud name and password', async () => {
		await loginPage.gotToRegister();

		const inputEmail = loginPage.emailField();
		await inputEmail.type('any_mail@email.com');
		await loginPage.submit();
		await expect(loginPage.emailInvalidText()).not.toBeVisible();
		await expect(loginPage.nameInvalidText()).toHaveText('The name must not be empty');
		await expect(loginPage.passwordInvalidText()).toHaveText('The password must not be empty');
	});

	test('expect user click in register button withoud name and email', async () => {
		await loginPage.gotToRegister();

		const passwordFiled = loginPage.passwordField();
		await passwordFiled.type('any_mail@email.com');
		await loginPage.submit();
		await expect(loginPage.passwordInvalidText()).not.toBeVisible();
		await expect(loginPage.nameInvalidText()).toHaveText('The name must not be empty');
		await expect(loginPage.emailInvalidText()).toHaveText('The email entered is invalid');
	});

	test('expect user click in register button with diferent password', async () => {
		await loginPage.gotToRegister();

		const passwordField = loginPage.passwordField();
		await passwordField.type('any_mail@email.com');

		const inputEmail = loginPage.emailField();
		await inputEmail.type('any_mail@email.com');

		const inputName = loginPage.nameField();
		await inputName.type('any_name');

		await loginPage.confirmPasswordField().type('any_passwor');

		await loginPage.submit();
		await expect(loginPage.confirmPasswordInvalidText()).toBeVisible();
		await expect(loginPage.confirmPasswordInvalidText()).toHaveText('The password confirmation does not match password');
	});
});
