import { test, expect } from './utils/test';
import { registerUser } from './utils/mocks/userAndPasswordMock';
import { LoginPage } from './pageobjects';

test.describe('[Register]', () => {
	let loginPage: LoginPage;

	test.beforeEach(async ({ page }) => {
		loginPage = new LoginPage(page);
		await page.goto('/');
	});

	test('expect user click in register button without data', async () => {
		await loginPage.btnRegister.click();
		await loginPage.btnSubmit.click();

		await expect(loginPage.nameInvalidText).toBeVisible();
		await expect(loginPage.emailInvalidText).toBeVisible();
		await expect(loginPage.passwordInvalidText).toBeVisible();
	});

	test('expect user click in register button with different password', async () => {
		await loginPage.btnRegister.click();
		await loginPage.passwordField.type(registerUser.password);
		await loginPage.emailField.type(registerUser.email);
		await loginPage.nameField.type(registerUser.name);
		await loginPage.confirmPasswordField.type('wrong_password');

		await loginPage.btnSubmit.click();
		await expect(loginPage.confirmPasswordInvalidText).toBeVisible();
		await expect(loginPage.confirmPasswordInvalidText).toHaveText('The password confirmation does not match password');
	});

	test('expect new user is created', async () => {
		await loginPage.btnRegister.click();
		await loginPage.registerNewUser(registerUser);
	});
});
