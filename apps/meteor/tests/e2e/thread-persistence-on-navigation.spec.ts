import type { IRoom } from '@rocket.chat/core-typings';

import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { createTargetChannelAndReturnFullRoom } from './utils';
import { sendFillerMessages } from './utils/sendMessage';
import type { BaseTest } from './utils/test';
import { expect, test } from './utils/test';

test.use({ storageState: Users.admin.state });

test.describe.serial('Thread persistence on navigation', () => {
	let poHomeChannel: HomeChannel;
	let targetChannel: IRoom;
	let threadParentMessageId: string;

	const setupChannelData = async (api: BaseTest['api']) => {
		const rid = targetChannel._id;

		const { message: parentMessage } = await (await api.post('/chat.postMessage', { roomId: rid, text: 'Thread parent message' })).json();
		threadParentMessageId = parentMessage._id;

		await api.post('/chat.postMessage', {
			roomId: rid,
			text: 'Thread reply that should persist after navigation',
			tmid: parentMessage._id,
		});

		await sendFillerMessages(api, rid);
	};

	test.beforeAll(async ({ api }) => {
		const { channel } = await createTargetChannelAndReturnFullRoom(api);
		targetChannel = channel;
		await setupChannelData(api);
	});

	test.afterAll(({ api }) => api.post('/channels.delete', { roomId: targetChannel._id }));

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);
	});

	test('expect thread content to persist after clicking Jump to recent messages', async ({ page }) => {
		await page.goto(`/channel/${targetChannel.name}?msg=${threadParentMessageId}`);
		await poHomeChannel.content.waitForChannel();

		await expect(page).toHaveURL(/.*thread/);
		await expect(poHomeChannel.content.threadMessageList).toBeVisible();
		const threadMessageCount = await poHomeChannel.content.threadMessageListItems.count();
		expect(threadMessageCount).toBeGreaterThan(0);

		const jumpToRecentButton = page.getByRole('button', { name: 'Jump to recent messages' });
		await expect(jumpToRecentButton).toBeVisible();
		await jumpToRecentButton.click();

		await expect(page).toHaveURL(/.*thread/);
		await expect(poHomeChannel.content.threadMessageList).toBeVisible();
		await expect(poHomeChannel.content.threadMessageListItems).toHaveCount(threadMessageCount);
		await expect(poHomeChannel.content.threadMessageList).toContainText('Thread reply that should persist after navigation');
	});
});
