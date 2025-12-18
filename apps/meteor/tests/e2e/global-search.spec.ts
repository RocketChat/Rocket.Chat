import type { IMessage } from '@rocket.chat/core-typings';
import { Random } from '@rocket.chat/random';

import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { setSettingValueById } from './utils';
import type { BaseTest } from './utils/test';
import { expect, test } from './utils/test';

test.use({ storageState: Users.admin.state });

test.describe.serial('Global Search', () => {
	let targetChannel: { name: string; _id: string };
	let targetGroup: { name: string; _id: string };
	let threadMessage: IMessage;
	let poHomeChannel: HomeChannel;

	const fillMessages = async (api: BaseTest['api']) => {
		const { message: parentMessage } = await (
			await api.post('/chat.postMessage', { roomId: targetChannel._id, text: 'This is main message in channel' })
		).json();

		const { message: childMessage } = await (
			await api.post('/chat.postMessage', { roomId: targetChannel._id, text: `This is thread message in channel`, tmid: parentMessage._id })
		).json();
		threadMessage = childMessage;
	};

	test.beforeAll(async ({ api }) => {
		await Promise.all([
			api
				.post('/channels.create', { name: Random.id() })
				.then((res) => res.json())
				.then((data) => {
					targetChannel = data.channel;
				}),
			api
				.post('/groups.create', {
					name: Random.id(),
					extraData: { encrypted: false },
				})
				.then((res) => res.json())
				.then((data) => {
					targetGroup = data.group;
				}),
			setSettingValueById(api, 'Search.defaultProvider.GlobalSearchEnabled', true),
		]);
		await fillMessages(api);
	});

	test.afterAll(({ api }) =>
		Promise.all([
			api.post('/channels.delete', { roomId: targetChannel._id }),
			api.post('/groups.delete', { roomId: targetGroup._id }),
			setSettingValueById(api, 'Search.defaultProvider.GlobalSearchEnabled', false),
		]),
	);

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);
		await page.goto('/home');
	});

	test('should open the correct message when jumping from global search in group to channel thread', async ({ page }) => {
		await poHomeChannel.navbar.openChat(targetGroup.name);
		await poHomeChannel.roomToolbar.btnSearchMessages.click();

		await poHomeChannel.tabs.searchMessages.search(threadMessage.msg.slice(10), { global: true }); // fill partial text to match search

		const message = await poHomeChannel.tabs.searchMessages.getResultItem(threadMessage.msg);
		await message.hover();
		const jumpToMessageButton = message.getByRole('button', { name: 'Jump to message' });
		await jumpToMessageButton.click();

		await expect(page.locator('header').getByRole('button').filter({ hasText: targetChannel.name })).toBeVisible(); // match channel name in room header
		await expect(page.getByText(threadMessage.msg)).toBeVisible();
	});
});
