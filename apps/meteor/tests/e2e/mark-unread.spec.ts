import { createAuxContext } from './fixtures/createAuxContext';
import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { createTargetChannel } from './utils';
import { test, expect } from './utils/test';

test.use({ storageState: Users.admin.state });

test.describe.serial('mark-unread', () => {
	let poHomeChannel: HomeChannel;
	let targetChannel: string;

	test.beforeEach(async ({ page, api }) => {
		poHomeChannel = new HomeChannel(page);
		targetChannel = await createTargetChannel(api, { members: ['user2'] });

		await page.emulateMedia({ reducedMotion: 'reduce' });
		await page.goto('/home');
	});

	test.afterEach(async ({ api }) => {
		await api.post('/channels.delete', { roomName: targetChannel });
	});

	test.describe('Mark Unread - Sidebar Action', () => {
		test('should not mark empty room as unread', async () => {
			await poHomeChannel.sidenav.selectMarkAsUnread(targetChannel);

			await expect(poHomeChannel.sidenav.getRoomBadge(targetChannel)).not.toBeVisible();
		});

		test('should mark a populated room as unread', async () => {
			await poHomeChannel.sidenav.openChat(targetChannel);
			await poHomeChannel.content.sendMessage('this is a message for reply');
			await poHomeChannel.sidenav.selectMarkAsUnread(targetChannel);

			await expect(poHomeChannel.sidenav.getRoomBadge(targetChannel)).toBeVisible();
		});

		test('should mark a populated room as unread - search', async () => {
			await poHomeChannel.sidenav.openChat(targetChannel);
			await poHomeChannel.content.sendMessage('this is a message for reply');
			await poHomeChannel.sidenav.selectMarkAsUnread(targetChannel);
			await poHomeChannel.sidenav.searchRoom(targetChannel);

			await expect(poHomeChannel.sidenav.getSearchChannelBadge(targetChannel)).toBeVisible();
		});
	});

	test.describe('Mark Unread - Message Action', () => {
		let poHomeChannelUser2: HomeChannel;

		test('should mark a populated room as unread', async ({ browser }) => {
			const { page: user2Page } = await createAuxContext(browser, Users.user2);
			poHomeChannelUser2 = new HomeChannel(user2Page);

			await poHomeChannelUser2.sidenav.openChat(targetChannel);
			await poHomeChannelUser2.content.sendMessage('this is a message for reply');
			await user2Page.close();

			await poHomeChannel.sidenav.openChat(targetChannel);

			// wait for the sidebar item to be read
			await poHomeChannel.sidenav.getSidebarItemByName(targetChannel, true).waitFor();
			await poHomeChannel.content.openLastMessageMenu();
			await poHomeChannel.markUnread.click();

			await expect(poHomeChannel.sidenav.getRoomBadge(targetChannel)).toBeVisible();
		});
	});
});
