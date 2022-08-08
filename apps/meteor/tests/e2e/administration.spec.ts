import { faker } from '@faker-js/faker';

import { test, expect } from './utils/test';
import { Admin } from './page-objects';

test.use({ storageState: 'admin-session.json' });

test.describe.parallel('administration', () => {
	let poAdmin: Admin;

	test.beforeEach(async ({ page }) => {
		poAdmin = new Admin(page);

		await page.goto('/admin');
	});

	test.describe('Info', () => {
		test.beforeEach(async () => {
			await poAdmin.sidenav.linkInfo.click();
		});

		test('expect download info as JSON', async ({ page }) => {
			const [download] = await Promise.all([page.waitForEvent('download'), page.locator('button:has-text("Download Info")').click()]);

			expect(download.suggestedFilename()).toBe('statistics.json');
		});
	});

	test.describe('Users', () => {
		test.beforeEach(async () => {
			await poAdmin.sidenav.linkUsers.click();
		});

		test('expect find "user1" user', async ({ page }) => {
			await poAdmin.inputSearchUsers.type('user1');

			expect(page.locator('table tr[qa-user-id="user1"]')).toBeVisible();
		});

		test('expect create a user', async () => {
			await poAdmin.tabs.users.btnNew.click();
			await poAdmin.tabs.users.inputName.type(faker.name.firstName());
			await poAdmin.tabs.users.inputUserName.type(faker.internet.userName());
			await poAdmin.tabs.users.inputEmail.type(faker.internet.email());
			await poAdmin.tabs.users.checkboxVerified.click();
			await poAdmin.tabs.users.inputPassword.type('any_password');
			await poAdmin.tabs.users.addRole('user');
			await poAdmin.tabs.users.btnSave.click();
		});
	});

	test.describe('Rooms', () => {
		test.beforeEach(async () => {
			await poAdmin.sidenav.linkRooms.click();
		});

		test('expect find "general" channel', async ({ page }) => {
			await poAdmin.inputSearchRooms.type('general');
			await page.waitForSelector('[qa-room-id="GENERAL"]');
		});
	});

	test.describe('Settings', () => {
		test.describe('General', () => {
			test.beforeEach(async ({ page }) => {
				await page.goto('/admin/settings/General');
			});

			test('expect be abble to reset a setting after a change', async () => {
				await poAdmin.inputSiteURL.type('any_text');
				await poAdmin.btnResetSiteURL.click();

				await poAdmin.inputSiteName.type('any_text');
				await poAdmin.btnResetSiteName.click();

				await poAdmin.btnAllowInvalidSelfSignedCerts.click();
				await poAdmin.btnResetAllowInvalidSelfSignedCerts.click();

				await poAdmin.btnEnableFavoriteRooms.click();
				await poAdmin.btnResetEnableFavoriteRooms.click();

				await poAdmin.btnUseCDNPrefix.click();
				await poAdmin.btnResetUseCDNPrefix.click();

				await poAdmin.btnForceSSL.click();
				await poAdmin.btnResetForceSSL.click();

				await poAdmin.inputGoogleTagManagerId.type('any_text');
				await poAdmin.btnResetGoogleTagManagerId.click();

				await poAdmin.inputBugsnagApiKey.type('any_text');
				await poAdmin.inputResetBugsnagApiKey.click();

				await poAdmin.inputRobotsFileContent.type('any_text');
				await poAdmin.btnResetRobotsFileContent.click();
			});
		});
	});
});
