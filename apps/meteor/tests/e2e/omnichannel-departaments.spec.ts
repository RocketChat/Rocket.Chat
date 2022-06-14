import { test, Page, expect } from '@playwright/test';

import { Departments, SideNav, Global, LoginPage } from './pageobjects';
import { adminLogin } from './utils/mocks/userAndPasswordMock';

test.describe('[Department]', () => {
	let loginPage: LoginPage;
	let sideNav: SideNav;
	let departments: Departments;
	let page: Page;
	let global: Global;

	test.beforeAll(async ({ browser }) => {
		page = await browser.newPage();
		const basePath = '/';

		await page.goto(basePath);
		loginPage = new LoginPage(page);
		sideNav = new SideNav(page);
		departments = new Departments(page);
		global = new Global(page);

		await loginPage.login(adminLogin);
		await sideNav.sidebarUserMenu.click();
		await sideNav.omnichannel.click();
	});

	test.describe('[Render]', async () => {
		test.beforeEach(async () => {
			await departments.departmentsLink.click();
			await departments.btnNewDepartment.click();
		});
		test('expect show all inputs', async () => {
			await departments.getAddScreen();
		});
	});
	test.describe('[Actions]', async () => {
		test.beforeEach(async () => {
			await departments.departmentsLink.click();
		});
		test.describe('[Create and Edit]', async () => {
			test.afterEach(async () => {
				await global.dismissToastBar();
			});

			test('expect new department is created', async () => {
				await departments.btnNewDepartment.click();
				await departments.doAddDepartments();
				await expect(departments.departmentAdded).toBeVisible();
			});

			test('expect department is edited', async () => {
				await departments.departmentAdded.click();
				await departments.doEditDepartments();
				await expect(departments.departmentAdded).toHaveText('any_name_edit');
			});
		});
		test.describe('[Delete department]', () => {
			test.beforeEach(async () => {
				await departments.btnTableDeleteDepartment.click();
			});
			test('expect dont show dialog on cancel delete department', async () => {
				await departments.btnModalCancelDeleteDepartment.click();
				await expect(departments.modalDepartment).not.toBeVisible();
				await expect(departments.departmentAdded).toBeVisible();
			});
			test('expect delete departments', async () => {
				await departments.btnModalDeleteDepartment.click();
				await expect(departments.modalDepartment).not.toBeVisible();
				await expect(departments.departmentAdded).not.toBeVisible();
			});
		});
	});
});
