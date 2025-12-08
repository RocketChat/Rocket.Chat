import type { IMessage } from '@rocket.chat/core-typings';
import { Random } from '@rocket.chat/random';

import { Users } from './fixtures/userStates';
import { setSettingValueById } from './utils';
import type { BaseTest } from './utils/test';
import { expect, test } from './utils/test';

test.use({ storageState: Users.admin.state });
test.describe.serial('Global Search', () => {
	let targetChannel: { name: string; _id: string };
	let targetGroup: { name: string; _id: string };
	let threadMessage: IMessage;

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
			setSettingValueById(api, 'Search.Provider', 'defaultProvider'),
			setSettingValueById(api, 'Search.defaultProvider.GlobalSearchEnabled', true),
		]);
		await fillMessages(api);
	});

	test.afterAll(({ api }) =>
		Promise.all([
			api.post('/channels.delete', { roomId: targetChannel._id }),
			api.post('/groups.delete', { roomId: targetGroup._id }),
			setSettingValueById(api, 'Search.defaultProvider.GlobalSearchEnabled', false),
			setSettingValueById(api, 'Search.Provider', 'defaultProvider'),
		]),
	);

	test.beforeEach(async ({ page }) => {
		await page.goto('/');
	});

	test('opens correct message when jumping from global search in group to channel thread', async ({ page }) => {
		await page.goto(`/group/${targetGroup.name}`);
		await expect(page.getByTitle('Search Messages')).toBeVisible();
		await page.getByTitle('Search Messages').click();

		await expect(page.getByText('Global search')).toBeVisible({ timeout: 10000 });
		await page.getByText('Global search').click();

		await expect(page.getByPlaceholder('Search Messages')).toBeVisible();
		await page.getByPlaceholder('Search Messages').fill(threadMessage.msg.slice(10)); // fill partial text to match search

		const message = page.getByRole('listitem').filter({ hasText: threadMessage.msg });
		await expect(message).toBeVisible();
		await message.hover();
		const jumpToMessageButton = message.getByTitle('Jump to message');
		await expect(jumpToMessageButton).toBeVisible();
		await jumpToMessageButton.click();

		await expect(page.locator('header').getByRole('button').filter({ hasText: targetChannel.name })).toBeVisible(); // match channel name in room header
		await expect(page.getByText(threadMessage.msg)).toBeVisible();
	});
});
