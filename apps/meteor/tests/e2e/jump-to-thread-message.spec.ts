import type { IMessage } from '@rocket.chat/core-typings';
import { Random } from '@rocket.chat/random';

import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import type { BaseTest } from './utils/test';
import { expect, test } from './utils/test';

test.use({ storageState: Users.admin.state });
test.describe.serial('Threads', () => {
	let poHomeChannel: HomeChannel;
	let targetChannel: { name: string; _id: string };
	let threadMessage: IMessage;
	let mainMessage: IMessage;

	const fillMessages = async (api: BaseTest['api']) => {
		const { message: parentMessage } = await (
			await api.post('/chat.postMessage', { roomId: targetChannel._id, text: 'this is a message for reply' })
		).json();
		mainMessage = parentMessage;

		// fill thread with messages
		const largeSimpleMessage = 'This is a large message with a lot of text to create scroll view in thread'.repeat(5);
		const { message: childMessage } = await (
			await api.post('/chat.postMessage', { roomId: targetChannel._id, text: largeSimpleMessage, tmid: parentMessage._id })
		).json();
		threadMessage = childMessage;

		await Promise.all(
			Array.from({ length: 5 }).map(() =>
				api.post('/chat.postMessage', { roomId: targetChannel._id, text: largeSimpleMessage, tmid: parentMessage._id }),
			),
		);

		// fill room with normal messages
		await Promise.all(
			Array.from({ length: 5 }).map(() => api.post('/chat.postMessage', { roomId: targetChannel._id, text: largeSimpleMessage })),
		);
	};

	test.beforeAll(async ({ api }) => {
		targetChannel = (await (await api.post('/channels.create', { name: Random.id() })).json()).channel;
		await fillMessages(api);
	});

	test.afterAll(({ api }) => api.post('/channels.delete', { roomId: targetChannel._id }));

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);
	});

	test('expect to jump scroll to a non-thread message on opening its message link', async () => {
		await poHomeChannel.gotoChannelMessage(targetChannel.name, mainMessage._id);

		await expect(poHomeChannel.content.getRoomById(targetChannel._id)).toBeVisible();
		await expect(poHomeChannel.content.getMessageById(mainMessage._id)).toBeVisible();
	});

	test('expect to jump scroll to thread message on opening its message link', async () => {
		await poHomeChannel.gotoChannelMessage(targetChannel.name, threadMessage._id, true);

		await expect(poHomeChannel.content.getRoomById(targetChannel._id)).toBeVisible();
		await expect(poHomeChannel.content.getThreadMessageById(threadMessage._id)).toBeVisible();
	});

	test('expect to jump scroll to thread message on opening its message link from a different channel', async () => {
		await poHomeChannel.gotoChannelMessage('general', threadMessage._id, true);

		await expect(poHomeChannel.content.getRoomById(targetChannel._id)).toBeVisible();
		await expect(poHomeChannel.content.getThreadMessageById(threadMessage._id)).toBeVisible();
	});
});
