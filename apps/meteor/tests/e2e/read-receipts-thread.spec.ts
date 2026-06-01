import type { Page } from '@playwright/test';

import { IS_EE } from './config/constants';
import { createAuxContext } from './fixtures/createAuxContext';
import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { createTargetChannel, setSettingValueById } from './utils';
import { expect, test } from './utils/test';

test.use({ storageState: Users.admin.state });

test.describe.serial('read-receipts-thread', () => {
	let poHomeChannel: HomeChannel;
	let targetChannel: string;
	let auxContext: { page: Page; poHomeChannel: HomeChannel } | undefined;

	test.skip(!IS_EE, 'Enterprise Only');

	test.beforeAll(async ({ api }) => {
		targetChannel = await createTargetChannel(api, { members: ['user1'] });
		await setSettingValueById(api, 'Message_Read_Receipt_Enabled', true);
		await setSettingValueById(api, 'Message_Read_Receipt_Store_Users', true);
	});

	test.afterAll(async ({ api }) => {
		await setSettingValueById(api, 'Message_Read_Receipt_Enabled', false);
		await setSettingValueById(api, 'Message_Read_Receipt_Store_Users', false);
	});

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);
		await page.goto('/home');
	});

	test.afterEach(async () => {
		if (auxContext) {
			await auxContext.page.close();
		}
		auxContext = undefined;
	});

	test('should show read receipt as viewed in thread when both users have the thread open', async ({ browser }) => {
		await poHomeChannel.navbar.openChat(targetChannel);
		await poHomeChannel.content.sendMessage('thread parent message');
		await poHomeChannel.content.openReplyInThread();
		await poHomeChannel.content.sendMessageInThread('first thread reply');

		const { page: auxPage } = await createAuxContext(browser, Users.user1);
		auxContext = { page: auxPage, poHomeChannel: new HomeChannel(auxPage) };
		await auxContext.poHomeChannel.navbar.openChat(targetChannel);
		await auxContext.poHomeChannel.content.openReplyInThread();

		await expect(poHomeChannel.content.lastUserThreadMessage.getByRole('status', { name: 'Message viewed' })).toBeVisible();
	});

	test('should show read receipt as viewed when the last unread user opens the thread', async ({ browser }) => {
		const { page: auxPage } = await createAuxContext(browser, Users.user1);
		auxContext = { page: auxPage, poHomeChannel: new HomeChannel(auxPage) };
		await auxContext.poHomeChannel.navbar.openChat(targetChannel);

		await poHomeChannel.navbar.openChat(targetChannel);
		await poHomeChannel.content.sendMessage('thread for delayed read');
		await poHomeChannel.content.openReplyInThread();
		await poHomeChannel.content.sendMessageInThread('reply in thread');

		await expect(poHomeChannel.content.lastUserThreadMessage.getByRole('status', { name: 'Message sent' })).toBeVisible();

		await expect(auxContext.poHomeChannel.content.lastThreadMessagePreview).toContainText('reply in thread');

		await auxContext.poHomeChannel.content.openReplyInThread();

		await expect(poHomeChannel.content.lastUserThreadMessage.getByRole('status', { name: 'Message viewed' })).toBeVisible();
		await expect(auxContext.poHomeChannel.content.lastUserThreadMessage.getByRole('status', { name: 'Message viewed' })).toBeVisible();
	});
});
