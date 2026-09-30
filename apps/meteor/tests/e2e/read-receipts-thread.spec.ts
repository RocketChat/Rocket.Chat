import type { Page } from '@playwright/test';

import { IS_EE } from './config/constants';
import { createAuxContext } from './fixtures/createAuxContext';
import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { createTargetChannel, sendMessage, setSettingValueById } from './utils';
import { expect, test } from './utils/test';

test.use({ storageState: Users.admin.state });

test.describe.serial('read-receipts-thread', () => {
	let poHomeChannel: HomeChannel;
	let targetChannel: string;
	let targetChannelId: string;
	let auxContext: { page: Page; poHomeChannel: HomeChannel } | undefined;

	test.skip(!IS_EE, 'Enterprise Only');

	test.beforeAll(async ({ api }) => {
		targetChannel = await createTargetChannel(api, { members: ['user1'] });
		targetChannelId = (await (await api.get('/channels.info', { roomName: targetChannel })).json()).channel._id;
		await setSettingValueById(api, 'Message_Read_Receipt_Enabled', true);
		await setSettingValueById(api, 'Message_Read_Receipt_Store_Users', true);
	});

	test.afterAll(async ({ api }) => {
		await setSettingValueById(api, 'Message_Read_Receipt_Enabled', false);
		await setSettingValueById(api, 'Message_Read_Receipt_Store_Users', false);
	});

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);
	});

	test.afterEach(async () => {
		if (auxContext) {
			await auxContext.page.close();
		}
		auxContext = undefined;
	});

	test('should show read receipt as viewed in thread when both users have the thread open', async ({ browser, api }) => {
		const tmid = await sendMessage(api, targetChannelId, 'thread parent message');
		await sendMessage(api, targetChannelId, 'first thread reply', tmid);
		await poHomeChannel.gotoChannelThread(targetChannel, tmid);

		const { page: auxPage } = await createAuxContext(browser, Users.user1, `/channel/${targetChannel}/thread/${tmid}`);
		auxContext = { page: auxPage, poHomeChannel: new HomeChannel(auxPage) };

		// the read receipt only flips once user1 has actually read the reply, so wait for it to render on their side first
		await expect(auxContext.poHomeChannel.content.lastUserThreadMessage).toContainText('first thread reply');

		await expect(poHomeChannel.content.lastUserThreadMessage.getByRole('status', { name: 'Message viewed' })).toBeVisible();
	});

	test('should show read receipt as viewed when the last unread user opens the thread', async ({ browser, api }) => {
		const { page: auxPage } = await createAuxContext(browser, Users.user1, `/channel/${targetChannel}`);
		auxContext = { page: auxPage, poHomeChannel: new HomeChannel(auxPage) };
		await auxContext.poHomeChannel.content.waitForChannel();

		const tmid = await sendMessage(api, targetChannelId, 'thread for delayed read');
		await sendMessage(api, targetChannelId, 'reply in thread', tmid);
		await poHomeChannel.gotoChannelThread(targetChannel, tmid);

		await expect(poHomeChannel.content.lastUserThreadMessage.getByRole('status', { name: 'Message sent' })).toBeVisible();

		await expect(auxContext.poHomeChannel.content.lastThreadMessagePreview).toContainText('reply in thread');

		await auxContext.poHomeChannel.content.openReplyInThread();

		await expect(poHomeChannel.content.lastUserThreadMessage.getByRole('status', { name: 'Message viewed' })).toBeVisible();
		await expect(auxContext.poHomeChannel.content.lastUserThreadMessage.getByRole('status', { name: 'Message viewed' })).toBeVisible();
	});
});
