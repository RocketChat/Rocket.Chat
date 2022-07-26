import { test, expect, Page } from '@playwright/test';
import faker from '@faker-js/faker';

import { validUserInserted } from './utils/mocks/userAndPasswordMock';
import { Auth, Administration, HomeChannel } from './page-objects';

test.describe('Settings Permissions', () => {
	let page: Page;
	let pageAuth: Auth;
	let pageAdmin: Administration;
	let pageHomeChannel: HomeChannel;

	const newHomeTitle = faker.animal.type();

	test.beforeAll(async ({ browser }) => {
		page = await browser.newPage();
		pageAuth = new Auth(page);
		pageAdmin = new Administration(page);
		pageHomeChannel = new HomeChannel(page);
	});

	test.describe('Give User Permissions', async () => {
		test.beforeAll(async () => {
			await pageAuth.doLogin();
			await pageHomeChannel.sidenav.btnAvatar.click();
			await pageHomeChannel.sidenav.linkAdmin.click();
			await pageAdmin.permissionsLink.click();
		});

		test.afterAll(async () => {
			await pageHomeChannel.sidenav.doLogout();
		});

		test('Set permission for user to manage settings', async () => {
			await pageAdmin.rolesSettingsFindInput.type('settings');
			await page.locator('table tbody tr:first-child td:nth-child(1) >> text="Change some settings"').waitFor();
			const isOptionChecked = await page.isChecked('table tbody tr:first-child td:nth-child(6) label input');

			if (!isOptionChecked) {
				await page.click('table tbody tr:first-child td:nth-child(6) label');
			}
		});

		test('Set Permission for user to change title page title', async () => {
			await pageAdmin.rolesSettingsTab.click();
			await pageAdmin.rolesSettingsFindInput.fill('Layout');
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
			await pageAuth.doLogin(validUserInserted);

			await pageHomeChannel.sidenav.btnAvatar.click();
			await pageHomeChannel.sidenav.linkAdmin.click();
			await pageAdmin.settingsLink.click();
			await pageAdmin.layoutSettingsButton.click();
		});

		test.afterAll(async () => {
			await pageHomeChannel.sidenav.doLogout();
		});

		test('expect new permissions is enabled for user', async () => {
			await pageAdmin.homeTitleInput.fill(newHomeTitle);
			await pageAdmin.buttonSave.click();
		});
	});

	test.describe('Verify settings change and cleanup', async () => {
		test.beforeAll(async () => {
			await page.goto('/');
			await pageAuth.doLogin();
			await pageHomeChannel.sidenav.btnAvatar.click();
			await pageHomeChannel.sidenav.linkAdmin.click();
			await pageAdmin.settingsLink.click();
			await pageAdmin.settingsSearch.type('Layout');
			await pageAdmin.layoutSettingsButton.click();
		});

		test.afterAll(async () => {
			await pageHomeChannel.sidenav.doLogout();
		});

		test('New settings value visible for admin as well', async () => {
			await page.locator('[data-qa-section="Content"]').click();
			await pageAdmin.homeTitleInput.waitFor();
			const text = await pageAdmin.homeTitleInput.inputValue();
			await pageAdmin.generalHomeTitleReset.click();
			await pageAdmin.buttonSave.click();
			expect(text).toEqual(newHomeTitle);
		});

		test('Clear all user permissions', async () => {
			await pageAdmin.permissionsLink.click();
			await pageAdmin.rolesSettingsFindInput.type('settings');
			await page.locator('table tbody tr:first-child td:nth-child(1) >> text="Change some settings"').waitFor();
			await page.click('table tbody tr:first-child td:nth-child(6) label');

			await pageAdmin.rolesSettingsTab.click();
			await pageAdmin.rolesSettingsFindInput.fill('Layout');
			await page.locator('table tbody tr:first-child td:nth-child(1) >> text="Layout"').waitFor();
			await page.click('table tbody tr td:nth-child(6) label');
			await page.click('table tbody tr:nth-child(3) td:nth-child(6) label');
		});
	});
});
