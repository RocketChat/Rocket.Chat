import type { Page } from '@playwright/test';

import { IS_EE } from './config/constants';
import { createAuxContext } from './fixtures/createAuxContext';
import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { createTargetChannel, setSettingValueById } from './utils';
import { expect, test } from './utils/test';

test.use({ storageState: Users.admin.state });

test.describe.serial('read-receipts', () => {
	let poHomeChannel: HomeChannel;
	let targetChannel: string;

	test.skip(!IS_EE, 'Enterprise Only');

	test.beforeAll(async ({ api }) => {
		targetChannel = await createTargetChannel(api);
	});

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);

		await page.goto('/home');
	});

	test.describe('read receipt settings disabled', async () => {
		test('should not show read receipts item menu', async ({ page }) => {
			await poHomeChannel.navbar.openChat(targetChannel);
			await poHomeChannel.content.sendMessage('hello world');
			await poHomeChannel.content.openLastMessageMenu();
			expect(page.locator('role=menuitem[name="Read receipts"]')).not.toBeVisible;
		});
	});

	test.describe('read receipts enabled', async () => {
		test.beforeAll(async ({ api }) => {
			await setSettingValueById(api, 'Message_Read_Receipt_Enabled', true);
			await setSettingValueById(api, 'Message_Read_Receipt_Store_Users', true);
		});

		test.afterAll(async ({ api }) => {
			await setSettingValueById(api, 'Message_Read_Receipt_Enabled', false);
			await setSettingValueById(api, 'Message_Read_Receipt_Store_Users', false);
		});

		let auxContext: { page: Page; poHomeChannel: HomeChannel } | undefined;

		test.afterEach(async () => {
			if (auxContext) {
				await auxContext.page.close();
			}
			auxContext = undefined;
		});

		test('should show read receipts message sent status in the sent message', async ({ browser }) => {
			const { page } = await createAuxContext(browser, Users.user1);
			auxContext = { page, poHomeChannel: new HomeChannel(page) };
			await auxContext.poHomeChannel.navbar.openChat(targetChannel);
			await auxContext.poHomeChannel.content.sendMessage('hello admin');

			await expect(auxContext.poHomeChannel.content.lastUserMessage.getByRole('status', { name: 'Message sent' })).toBeVisible();
		});

		test('should show read receipts message viewed status in the sent message', async () => {
			await poHomeChannel.navbar.openChat(targetChannel);
			await expect(poHomeChannel.content.lastUserMessage.getByRole('status', { name: 'Message viewed' })).toBeVisible();
		});

		test('should show the reads receipt modal with the users who read the message', async ({ page }) => {
			await poHomeChannel.navbar.openChat(targetChannel);
			await poHomeChannel.content.openLastMessageMenu();
			await page.locator('role=menuitem[name="Read receipts"]').click();

			await expect(page.getByRole('dialog').getByRole('listitem')).toHaveCount(2);
		});
	});

	test.describe('read receipts enabled without detailed storage', async () => {
		test.beforeAll(async ({ api }) => {
			await setSettingValueById(api, 'Message_Read_Receipt_Enabled', true);
			await setSettingValueById(api, 'Message_Read_Receipt_Store_Users', false);
		});

		test.afterAll(async ({ api }) => {
			await setSettingValueById(api, 'Message_Read_Receipt_Enabled', false);
			await setSettingValueById(api, 'Message_Read_Receipt_Store_Users', false);
		});

		let auxContext: { page: Page; poHomeChannel: HomeChannel } | undefined;

		test.afterEach(async () => {
			if (auxContext) {
				await auxContext.page.close();
			}
			auxContext = undefined;
		});

		test('should show read receipts menu item when detailed storage is disabled', async ({ page }) => {
			await poHomeChannel.navbar.openChat(targetChannel);
			await poHomeChannel.content.sendMessage('test without detailed storage');
			await poHomeChannel.content.openLastMessageMenu();
			await expect(page.locator('role=menuitem[name="Read receipts"]')).toBeVisible();
		});

		test('should show the reads receipt modal with users based on last seen', async ({ page, browser }) => {
			// Send a message from user1
			const { page: user1Page } = await createAuxContext(browser, Users.user1);
			auxContext = { page: user1Page, poHomeChannel: new HomeChannel(user1Page) };
			await auxContext.poHomeChannel.navbar.openChat(targetChannel);
			await auxContext.poHomeChannel.content.sendMessage('message for last seen test');

			// Admin reads the message
			await poHomeChannel.navbar.openChat(targetChannel);
			await page.waitForTimeout(1000); // Wait for subscription to update

			// Go back to user1 and check receipts
			await auxContext.poHomeChannel.content.openLastMessageMenu();
			await user1Page.locator('role=menuitem[name="Read receipts"]').click();

			// Should show at least user1 (sender) and admin (who read it)
			await expect(user1Page.getByRole('dialog').getByRole('listitem')).toHaveCount.greaterThanOrEqual(1);
		});
	});
});
