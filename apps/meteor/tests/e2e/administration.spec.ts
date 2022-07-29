import { test, expect } from './utils/test';
import { Admin } from './page-objects';

test.use({ storageState: 'session-admin.json' });

test.describe.parallel('administration', () => {
	let poAdmin: Admin;

	test.beforeEach(async ({ page }) => {
		poAdmin = new Admin(page);

		await page.goto('/admin');
	});

	test.describe('/rooms', () => {
		test.beforeEach(async () => {
			await poAdmin.sidenav.linkRooms.click();
		});

		test('expect find "general" channel', async ({ page }) => {
			await poAdmin.inputSearchRooms.type('general');

			expect(page.locator('table tr[qa-room-id="GENERAL"]')).toBeVisible();
		});
	});

	test.describe('/users', () => {
		test.beforeEach(async () => {
			await poAdmin.sidenav.linkUsers.click();
		});

		test('expect find "user1" user', async ({ page }) => {
			await poAdmin.inputSearchUsers.type('user1');

			expect(page.locator('table tr[qa-user-id="user1"]')).toBeVisible();
		});
	});

	test.describe('/settings', () => {
		test.beforeEach(async () => {
			await poAdmin.sidenav.linkSettings.click();
		});

		test.describe('GENERAL', () => {
			test.beforeEach(async ({ page }) => {
				await poAdmin.inputSearchSettings.type('general');
				await page.locator('[data-qa-id="General"] >> text="Open"').click();
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

				await poAdmin.inputGoogleTagManagerId.click();
				await poAdmin.btnResetGoogleTagManagerId.click();

				await poAdmin.inputBugsnagApiKey.click();
				await poAdmin.inputResetBugsnagApiKey.click();

				await poAdmin.inputRobotsFileContent.type('any_text');
				await poAdmin.btnResetRobotsFileContent.click();
			});
		});
	});
});
