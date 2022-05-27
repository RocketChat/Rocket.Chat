import { test, expect, Page } from '@playwright/test';

import { validUser, WRONG_PASSWORD } from './utils/mocks/userAndPasswordMock';
import { HOME_SELECTOR } from './utils/mocks/waitSelectorsMock';
import { Login } from './page-objects';

test.describe('[Login]', () => {
	let page: Page;
	let login: Login;

	test.beforeEach(async ({ browser }) => {
		const context = await browser.newContext();

		page = await context.newPage();
		login = new Login(page);

		await page.goto('/');
	});

	test('expect user write a password incorrectly', async () => {
		const invalidUserPassword = {
			email: validUser.email,
			password: WRONG_PASSWORD,
		};

		await login.doLogin(invalidUserPassword);
		await expect(login.toast).toBeVisible();
	});

	test('expect user make login', async () => {
		await login.doLogin(validUser);
		await page.waitForSelector(HOME_SELECTOR);
	});
});
