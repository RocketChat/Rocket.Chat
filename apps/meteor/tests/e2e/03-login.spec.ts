import { Page, test, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';

import { Auth } from './page-objects';

test.describe('Login', () => {
	let page: Page;
	let pageAuth: Auth;

	test.beforeAll(async ({ browser }) => {
		page = await browser.newPage();
		pageAuth = new Auth(page);
	});

	test('expect to show a toast if the provided password is incorrect', async () => {
		await page.goto('/');

		await pageAuth.inputEmailOrUsername.type(faker.internet.email());
		await pageAuth.inputPassword.type('any_password');
		await pageAuth.btnSubmit.click();

		await expect(pageAuth.toastError).toBeVisible();
	});
});
