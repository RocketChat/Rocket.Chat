import { faker } from '@faker-js/faker';

import { test } from './utils/test';
import { LoginPage, SideNav } from './pageobjects';
import { adminLogin } from './utils/mocks/userAndPasswordMock';

test.describe('[Channel]', async () => {
	let sideNav: SideNav;
	let loginPage: LoginPage;

	test.beforeAll(async ({ browser }) => {
		const page = await browser.newPage();
		loginPage = new LoginPage(page);
		sideNav = new SideNav(page);

		await page.goto('/');
		await loginPage.doLogin(adminLogin);
	});

	test('expect create private channel', async () => {
		await sideNav.doCreateChannel(faker.animal.type() + Date.now(), true);
	});

	test('expect create public channel', async () => {
		await sideNav.doCreateChannel(faker.animal.type() + Date.now());
	});
});
