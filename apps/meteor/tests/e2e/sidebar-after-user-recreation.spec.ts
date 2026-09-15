import type { Page } from '@playwright/test';

import { DEFAULT_USER_CREDENTIALS } from './config/constants';
import { Authenticated, HomeChannel, Login } from './page-objects';
import { test, expect } from './utils/test';
import type { ITestUser } from './utils/user-helpers';
import { createTestUser, loginTestUser } from './utils/user-helpers';

test.describe('Sidebar after user recreation', () => {
	let user: ITestUser;
	let page: Page;

	test.beforeAll(async ({ api, browser }) => {
		user = await createTestUser(api);
		const { state } = await loginTestUser(api, user);
		page = await browser.newPage({ storageState: state });
		await page.goto('/home');
		await new Authenticated(page).waitForDisplay();
	});

	test.afterAll(async () => {
		await page.close();
		await user.delete();
	});

	test('lists each auto-joined channel once after logging back in as the recreated user without reloading', async ({ api }) => {
		const poLogin = new Login(page);
		const poHomeChannel = new HomeChannel(page);
		const { username } = user.data;

		await test.step('delete the logged-in user', async () => {
			await user.delete();
			await poLogin.waitForDisplay();
		});

		await test.step('recreate the user and log in on the same page', async () => {
			user = await createTestUser(api, { username });
			await poLogin.login(username, DEFAULT_USER_CREDENTIALS.password);
			await new Authenticated(page).waitForDisplay();
		});

		await expect(poHomeChannel.sidebar.getSidebarItemByName('general')).toHaveCount(1);
	});
});
