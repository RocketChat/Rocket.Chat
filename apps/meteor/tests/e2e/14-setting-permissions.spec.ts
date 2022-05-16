import { test, expect } from '@playwright/test';
import faker from '@faker-js/faker';

import LoginPage from './utils/pageobjects/LoginPage';
import { adminLogin, validUserInserted } from './utils/mocks/userAndPasswordMock';
import Administration from './utils/pageobjects/Administration';
import SideNav from './utils/pageobjects/SideNav';

test.describe('[Rocket.Chat Settings based permissions]', () => {
	let admin: Administration;
	let sideNav: SideNav;
	let loginPage: LoginPage;
	const newHomeTitle = faker.animal.type();
	test.beforeAll(async ({ browser }) => {
		const context = await browser.newContext();
		const page = await context.newPage();
		sideNav = new SideNav(page);
		admin = new Administration(page);
		loginPage = new LoginPage(page);
	});

	test.describe('[Give User Permissions]', async () => {
		test.beforeAll(async () => {
			await loginPage.goto('/');
			await loginPage.login(adminLogin);
			await sideNav.sidebarUserMenu().click();
			await sideNav.admin().click();
			await admin.permissionsLink().click();
		});

		test.afterAll(async () => {
			await loginPage.goto('/home');
			await loginPage.logout();
		});

		test('Set permission for user to manage settings', async () => {
			await admin.rolesSettingsFindInput().type('settings');
			await admin.getPage().locator('table tbody tr:first-child td:nth-child(1) >> text="Change some settings"').waitFor();
			const isOptionChecked = await admin.getPage().isChecked('table tbody tr:first-child td:nth-child(6) label input');
			if (!isOptionChecked) {
				await admin.getPage().click('table tbody tr:first-child td:nth-child(6) label');
			}
		});

		test('Set Permission for user to change title page title', async () => {
			await admin.rolesSettingsTab().click();
			await admin.rolesSettingsFindInput().fill('Layout');
			await admin.getPage().locator('table tbody tr:first-child td:nth-child(1) >> text="Layout"').waitFor();
			const isOptionChecked = await admin.getPage().isChecked('table tbody tr:first-child td:nth-child(6) label input');
			const changeHomeTitleSelected = await admin.getPage().isChecked('table tbody tr:nth-child(3) td:nth-child(6) label input');
			if (!isOptionChecked && !changeHomeTitleSelected) {
				await admin.getPage().click('table tbody tr:first-child td:nth-child(6) label');
				await admin.getPage().click('table tbody tr:nth-child(3) td:nth-child(6) label');
			}
		});
	});

	test.describe('Test new user setting permissions', async () => {
		test.beforeAll(async () => {
			await loginPage.goto('/');
			await loginPage.login(validUserInserted);
			await sideNav.sidebarUserMenu().click();
			await sideNav.admin().click();
			await admin.settingsLink().click();
			await admin.layoutSettingsButton().click();
		});
		test.afterAll(async () => {
			await loginPage.goto('/home');
			await loginPage.logout();
		});

		test('expect new permissions is enabled for user', async () => {
			await admin.homeTitleInput().fill(newHomeTitle);
			await admin.buttonSave().click();
		});
	});

	test.describe('[Verify settings change and cleanup]', async () => {
		test.beforeAll(async () => {
			await loginPage.goto('/');
			await loginPage.login(adminLogin);
			await sideNav.sidebarUserMenu().click();
			await sideNav.admin().click();
			await admin.settingsLink().click();
			await admin.settingsSearch().type('Layout');
			await admin.layoutSettingsButton().click();
		});

		test.afterAll(async () => {
			await loginPage.goto('/home');
			await loginPage.logout();
		});

		test('New settings value visible for admin as well', async () => {
			await admin.getPage().locator('[data-qa-section="Content"]').click();
			await admin.homeTitleInput().waitFor();
			const text = await admin.homeTitleInput().inputValue();
			await admin.generalHomeTitleReset().click();
			await admin.buttonSave().click();
			expect(text).toEqual(newHomeTitle);
		});

		test('Clear all user permissions', async () => {
			await admin.permissionsLink().click();
			await admin.rolesSettingsFindInput().type('settings');
			await admin.getPage().locator('table tbody tr:first-child td:nth-child(1) >> text="Change some settings"').waitFor();
			await admin.getPage().click('table tbody tr:first-child td:nth-child(6) label');

			await admin.rolesSettingsTab().click();
			await admin.rolesSettingsFindInput().fill('Layout');
			await admin.getPage().locator('table tbody tr:first-child td:nth-child(1) >> text="Layout"').waitFor();
			await admin.getPage().click('table tbody tr td:nth-child(6) label');
			await admin.getPage().click('table tbody tr:nth-child(3) td:nth-child(6) label');
		});
	});
});
