import { Page, test, expect } from '@playwright/test';

import { registerUser, WRONG_PASSWORD } from './utils/mocks/userAndPasswordMock';
import { Login } from './page-objects';

test.describe('[Register]', () => {
	let page: Page;
	let login: Login;

	test.beforeEach(async ({ browser }) => {
		const context = await browser.newContext();

		page = await context.newPage();
		login = new Login(page);

		await page.goto('/');
	});

	test('expect user click in register button without data', async () => {
		await login.btnRegister.click();
		await login.btnFormSubmit.click();

		expect(await login.textErrorName.isVisible()).toBeTruthy();
		expect(await login.textErrorEmail.isVisible()).toBeTruthy();
		expect(await login.textErrorPassword.isVisible()).toBeTruthy();
	});

	test('expect user click in register button with different password', async () => {
		await login.btnRegister.click();
		await login.doRegister({ ...registerUser, passwordConfirm: WRONG_PASSWORD }, false);

		expect(await login.textErrorPasswordConfirm.textContent()).toBe('The password confirmation does not match password');
	});

	test('expect new user is created', async () => {
		await login.btnRegister.click();
		await login.doRegister(registerUser);
	});
});
