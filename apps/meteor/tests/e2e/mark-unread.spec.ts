import type { IRoom } from '@rocket.chat/core-typings';

import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { createTargetChannelAndReturnFullRoom } from './utils';
import { test, expect } from './utils/test';

test.use({ storageState: Users.admin.state });

test.describe.serial('mark-unread', () => {
	let poHomeChannel: HomeChannel;
	let targetChannel: Required<IRoom>;

	test.beforeEach(async ({ page, api }) => {
		poHomeChannel = new HomeChannel(page);
		const result = await createTargetChannelAndReturnFullRoom(api, { members: ['user2'] });
		targetChannel = result.channel as Required<IRoom>;

		await page.emulateMedia({ reducedMotion: 'reduce' });
		await page.goto('/home');
	});

	test.afterEach(async ({ api }) => {
		await api.post('/channels.delete', { roomName: targetChannel.name });
	});

	test.describe('Mark Unread - Sidebar Action', () => {
		test('should not mark empty room as unread', async () => {
			await poHomeChannel.sidenav.selectMarkAsUnread(targetChannel.name);

			await expect(poHomeChannel.sidenav.getSidebarItemBadge(targetChannel.name)).not.toBeVisible();
		});

		test('should mark a populated room as unread', async () => {
			await poHomeChannel.sidenav.openChat(targetChannel.name);
			await poHomeChannel.content.sendMessage('this is a message for reply');
			await poHomeChannel.sidenav.selectMarkAsUnread(targetChannel.name);

			await expect(poHomeChannel.sidenav.getSidebarItemBadge(targetChannel.name)).toBeVisible();
		});

		test('should mark a populated room as unread - search', async () => {
			await poHomeChannel.sidenav.openChat(targetChannel.name);
			await poHomeChannel.content.sendMessage('this is a message for reply');
			await poHomeChannel.sidenav.selectMarkAsUnread(targetChannel.name);
			await poHomeChannel.sidenav.searchRoom(targetChannel.name);

			await expect(poHomeChannel.sidenav.getSearchItemBadge(targetChannel.name)).toBeVisible();
		});
	});

	test.describe('Mark Unread - Message Action', () => {
		test.use({ storageState: Users.user2.state });

		test('should mark a populated room as unread', async ({ api }) => {
			await api.post('/chat.sendMessage', {
				message: {
					rid: targetChannel._id,
					msg: 'this is a message for reply',
				},
			});

			await expect(async () => {
				await poHomeChannel.sidenav.openChat(targetChannel.name);
				await poHomeChannel.content.openLastMessageMenu();
				await poHomeChannel.markUnread.click();
				await expect(poHomeChannel.sidenav.getSidebarItemBadge(targetChannel.name)).toBeVisible();
			}).toPass();
		});
	});
});
