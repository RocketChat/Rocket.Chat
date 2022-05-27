import { test, expect } from '@playwright/test';

import { VALID_EMAIL, INVALID_EMAIL, INVALID_EMAIL_WITHOUT_MAIL_PROVIDER } from './utils/mocks/userAndPasswordMock';
import { Login } from './page-objects';

test.describe('[Forgot Password]', () => {
	let login: Login;

	test.beforeEach(async ({ page }) => {
		login = new Login(page);

		await page.goto('/');
		await login.btnPasswordForgot.click();
	});

	test('expect be required', async () => {
		await login.btnFormSubmit.click();

		expect(await login.textErrorEmail.isVisible()).toBeTruthy();
	});

	test('expect invalid for email without domain', async () => {
		await login.inputEmail.type(INVALID_EMAIL_WITHOUT_MAIL_PROVIDER);
		await login.btnFormSubmit.click();

		expect(await login.textErrorEmail.isVisible()).toBeTruthy();
	});

	test('expect be invalid for email with invalid domain', async () => {
		await login.inputEmail.type(INVALID_EMAIL);
		await login.btnFormSubmit.click();

		expect(await login.textErrorEmail.isVisible()).toBeTruthy();
	});

	test('expect user type a valid email', async () => {
		await login.inputEmail.type(VALID_EMAIL);
		await login.btnFormSubmit.click();

		expect(await login.toastSuccess.isVisible()).toBeTruthy();
	});
});
