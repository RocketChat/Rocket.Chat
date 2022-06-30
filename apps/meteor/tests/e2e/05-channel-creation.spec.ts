import { test } from '@playwright/test';
import { faker } from '@faker-js/faker';

import { Login, SideNav } from './pageobjects';
import { adminLogin } from './utils/mocks/userAndPasswordMock';

test.describe('[Channel]', async () => {
	let sideNav: SideNav;
	let login: Login;

	test.beforeAll(async ({ browser }) => {
		const page = await browser.newPage();
		login = new Login(page);
		sideNav = new SideNav(page);

		await page.goto('/');
		await login.doLogin(adminLogin);
	});

	test('expect create private channel', async () => {
		await sideNav.doCreateChannel(faker.animal.type() + Date.now(), true);
	});

	test('expect create public channel', async () => {
		await sideNav.doCreateChannel(faker.animal.type() + Date.now());
	});
});
