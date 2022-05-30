import { test, Page, expect } from '@playwright/test';

import LoginPage from './utils/pageobjects/LoginPage';
import SideNav from './utils/pageobjects/SideNav';
import Departments from './utils/pageobjects/Departments';
import { adminLogin } from './utils/mocks/userAndPasswordMock';

test.describe.only('[Department]', () => {
	let loginPage: LoginPage;
	let sideNav: SideNav;
	let departments: Departments;
	let page: Page;
	test.beforeAll(async ({ browser }) => {
		page = await browser.newPage();
		const basePath = '/';

		await page.goto(basePath);
		loginPage = new LoginPage(page);
		sideNav = new SideNav(page);
		departments = new Departments(page);

		await loginPage.login(adminLogin);
		await sideNav.omnichannel().click();
		await departments.departmentsLink.click();
		await departments.btnNewDepartment.click();
	});

	test.describe('[Render]', async () => {
		test.beforeEach(async () => {
			await departments.btnNewDepartment.click();
		});
		test('expect show all inputs', async () => {
			await departments.getAddScreen();
		});
	});
	test.describe('[Actions]', async () => {
		expect(1).toBe(1);
	});
});
