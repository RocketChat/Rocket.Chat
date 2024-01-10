import { faker } from '@faker-js/faker';

import { IS_EE } from './config/constants';
import { Users } from './fixtures/userStates';
import { Admin } from './page-objects';
import { createTargetChannel } from './utils';
import { test, expect } from './utils/test';

test.use({ storageState: Users.admin.state });

test.describe.parallel('administration', () => {
	let poAdmin: Admin;
	let targetChannel: string;

	test.beforeEach(async ({ page }) => {
		poAdmin = new Admin(page);
	});

	test.describe('Workspace', () => {
		test.beforeEach(async ({ page }) => {
			await page.goto('/admin/info');
		});

		test('expect download info as JSON', async ({ page }) => {
			const [download] = await Promise.all([page.waitForEvent('download'), page.locator('button:has-text("Download info")').click()]);

			await expect(download.suggestedFilename()).toBe('statistics.json');
		});
	});

	test.describe('Users', () => {
		test.beforeEach(async ({ page }) => {
			await page.goto('/admin/users');
		});

		test('expect find "user1" user', async ({ page }) => {
			await poAdmin.inputSearchUsers.type('user1');

			await expect(page.locator('table tr[qa-user-id="user1"]')).toBeVisible();
		});

		test('expect create a user', async () => {
			await poAdmin.tabs.users.btnNewUser.click();
			await poAdmin.tabs.users.inputName.type(faker.person.firstName());
			await poAdmin.tabs.users.inputUserName.type(faker.internet.userName());
			await poAdmin.tabs.users.inputSetManually.click();
			await poAdmin.tabs.users.inputPassword.type('any_password');
			await poAdmin.tabs.users.inputConfirmPassword.type('any_password');
			await expect(poAdmin.tabs.users.userRole).toBeVisible();
			await poAdmin.tabs.users.btnSave.click();
		});

		test('expect SMTP setup warning and routing to email settings', async ({ page }) => {
			await poAdmin.tabs.users.btnInvite.click();
			await poAdmin.tabs.users.setupSmtpLink.click();
			await expect(page).toHaveURL('/admin/settings/Email');
		});
	});

	test.describe('Rooms', () => {
		test.beforeAll(async ({ api }) => {
			targetChannel = await createTargetChannel(api);
		});
		test.beforeEach(async ({ page }) => {
			await page.goto('/admin/rooms');
		});

		test('expect find "general" channel', async ({ page }) => {
			await poAdmin.inputSearchRooms.type('general');
			await page.waitForSelector('[qa-room-id="GENERAL"]');
		});

		test('should edit target channel', async () => {
			await poAdmin.inputSearchRooms.type(targetChannel);
			await poAdmin.getRoomRow(targetChannel).click();
			await poAdmin.privateLabel.click();
			await poAdmin.btnSave.click();
			await expect(poAdmin.getRoomRow(targetChannel)).toContainText('Private Channel');
		});
		
	});

	test.describe('Permissions', () => {
		test.beforeEach(async ({ page }) => {
			await page.goto('/admin/permissions');
		});

		test('expect open upsell modal if not enterprise', async ({ page }) => {
			test.skip(IS_EE);
			await poAdmin.btnCreateRole.click();
			await page.waitForSelector('role=dialog[name="Custom roles"]');
		});
	});

	test.describe('Mailer', () => {
		test.beforeEach(async ({ page }) => {
			await page.goto('/admin/mailer');
		})

		test('should not have any accessibility violations', async ({ makeAxeBuilder }) => {
			const results = await makeAxeBuilder().analyze();
			expect(results.violations).toEqual([]);
		})
	})

	test.describe('Settings', () => {
		test.describe('General', () => {
			test.beforeEach(async ({ page }) => {
				await page.goto('/admin/settings/General');
			});

			test('expect be able to reset a setting after a change', async () => {
				await poAdmin.inputSiteURL.type('any_text');
				await poAdmin.btnResetSiteURL.click();
			});
		});
	});
});
