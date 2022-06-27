import { Page } from '@playwright/test';

import { test, expect } from './utils/test';
import { validUser } from './utils/mocks/userAndPasswordMock';
import { Global, LoginPage } from './pageobjects';
import { HOME_SELECTOR } from './utils/mocks/waitSelectorsMock';

test.describe('[Login]', () => {
	let page: Page;
	let loginPage: LoginPage;
	let global: Global;

	test.beforeEach(async ({ browser }) => {
		page = await browser.newPage();
		loginPage = new LoginPage(page);
		global = new Global(page);
		await page.goto('/');
	});

	test('expect user write a password incorrectly', async () => {
		const invalidUserPassword = {
			email: validUser.email,
			password: 'any_password1',
		};
		await loginPage.doLogin(invalidUserPassword, false);
		await expect(global.getToastBarError).toBeVisible();
	});

	test('expect user make login', async () => {
		await loginPage.doLogin(validUser);
		await page.waitForSelector(HOME_SELECTOR);
	});
});
