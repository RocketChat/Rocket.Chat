import { test, expect, Page } from '@playwright/test';

import { validUser } from './utils/mocks/userAndPasswordMock';
import { Global, Login } from './pageobjects';

test.describe('[Login]', () => {
	let page: Page;
	let login: Login;
	let global: Global;

	test.beforeEach(async ({ browser }) => {
		page = await browser.newPage();
		login = new Login(page);
		global = new Global(page);
		await page.goto('/');
	});

	test('expect user write a password incorrectly', async () => {
		const invalidUserPassword = {
			email: validUser.email,
			password: 'any_password1',
		};
		await login.doLogin(invalidUserPassword, false);
		await expect(global.getToastBarError).toBeVisible();
	});

	test('expect user make login', async () => {
		await login.doLogin(validUser);
		await page.waitForSelector('[data-qa="sidebar-avatar-button"]');
		await expect(login.page.locator('[data-qa="sidebar-avatar-button"]')).toBeVisible();
	});
});
