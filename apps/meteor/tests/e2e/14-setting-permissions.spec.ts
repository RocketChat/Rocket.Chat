import { test, expect, Page } from '@playwright/test';
import faker from '@faker-js/faker';

import { adminLogin, validUserInserted } from './utils/mocks/userAndPasswordMock';
import { Login, Administration, SideNav } from './page-objects';

test.describe('Rocket.Chat Settings based permissions', () => {
	let page: Page;
	let login: Login;
	let admin: Administration;
	let sideNav: SideNav;

	const newHomeTitle = faker.animal.type();
	test.beforeAll(async ({ browser }) => {
		const context = await browser.newContext();

		page = await context.newPage();
		login = new Login(page);
		sideNav = new SideNav(page);
		admin = new Administration(page);
	});

	test.describe('Give User Permissions', async () => {
		test.beforeAll(async () => {
			await page.goto('/');
			await login.doLogin(adminLogin);
			await sideNav.sidebarUserMenu.click();
			await sideNav.admin.click();
			await admin.linkPermissions.click();
		});

		test.afterAll(async () => {
			await page.goto('/home');
			await login.doLogout();
		});

		test('Set permission for user to manage settings', async () => {
			await admin.inputFilterPermissions.type('settings');
			await page.locator('table tbody tr:first-child td:nth-child(1) >> text="Change some settings"').waitFor();
			const isOptionChecked = await page.isChecked('table tbody tr:first-child td:nth-child(6) label input');
			if (!isOptionChecked) {
				await page.click('table tbody tr:first-child td:nth-child(6) label');
			}
		});

		test('Set Permission for user to change title page title', async () => {
			await admin.rolesSettingsTab.click();
			await admin.inputFilterPermissions.fill('Layout');
			await page.locator('table tbody tr:first-child td:nth-child(1) >> text="Layout"').waitFor();
			const isOptionChecked = await page.isChecked('table tbody tr:first-child td:nth-child(6) label input');
			const changeHomeTitleSelected = await page.isChecked('table tbody tr:nth-child(3) td:nth-child(6) label input');
			if (!isOptionChecked && !changeHomeTitleSelected) {
				await page.click('table tbody tr:first-child td:nth-child(6) label');
				await page.click('table tbody tr:nth-child(3) td:nth-child(6) label');
			}
		});
	});

	test.describe('Test new user setting permissions', async () => {
		test.beforeAll(async () => {
			await page.goto('/');
			await login.doLogin(validUserInserted);
			await sideNav.sidebarUserMenu.click();
			await sideNav.admin.click();
			await admin.linkSettings.click();
			await admin.btnLayoutSettings.click();
		});
		test.afterAll(async () => {
			await page.goto('/home');
			await login.doLogout();
		});

		test('expect new permissions is enabled for user', async () => {
			await admin.inputHomeTitle.fill(newHomeTitle);
			await admin.btnSave.click();
		});
	});

	test.describe('Verify settings change and cleanup', async () => {
		test.beforeAll(async () => {
			await page.goto('/');
			await login.doLogin(adminLogin);
			await sideNav.sidebarUserMenu.click();
			await sideNav.admin.click();
			await admin.linkSettings.click();
			await admin.inputSearchSettings.type('Layout');
			await admin.btnLayoutSettings.click();
		});

		test.afterAll(async () => {
			await page.goto('/home');
			await login.doLogout();
		});

		test('New settings value visible for admin as well', async () => {
			await page.locator('data-qa-section="Content"').click();
			await admin.inputHomeTitle.waitFor();
			const text = await admin.inputHomeTitle.inputValue();
			await admin.generalHomeTitleReset.click();
			await admin.btnSave.click();
			expect(text).toEqual(newHomeTitle);
		});

		test('Clear all user permissions', async () => {
			await admin.linkPermissions.click();
			await admin.inputFilterPermissions.type('settings');
			await page.locator('table tbody tr:first-child td:nth-child(1) >> text="Change some settings"').waitFor();
			await page.click('table tbody tr:first-child td:nth-child(6) label');

			await admin.rolesSettingsTab.click();
			await admin.inputFilterPermissions.fill('Layout');
			await page.locator('table tbody tr:first-child td:nth-child(1) >> text="Layout"').waitFor();
			await page.click('table tbody tr td:nth-child(6) label');
			await page.click('table tbody tr:nth-child(3) td:nth-child(6) label');
		});
	});
});
