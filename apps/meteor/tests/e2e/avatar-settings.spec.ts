import type { Page, Route } from '@playwright/test';

import { createAuxContext } from './fixtures/createAuxContext';
import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { createDirectMessageRoom, createTargetChannelAndReturnFullRoom, createTargetGroupAndReturnFullRoom, deleteRoom } from './utils';
import { setSettingValueById } from './utils/setSettingValueById';
import { test, expect } from './utils/test';

test.use({ storageState: Users.admin.state });

const providerUrlPrefix = 'https://example.com/avatar/';

test.describe.serial('avatar-settings', () => {
	let poHomeChannel: HomeChannel;

	test.beforeAll(async ({ api }) => {
		await setSettingValueById(api, 'Accounts_RoomAvatarExternalProviderUrl', `${providerUrlPrefix}{roomId}`);
		await setSettingValueById(api, 'Accounts_AvatarExternalProviderUrl', `${providerUrlPrefix}{username}`);
	});

	test.afterAll(async ({ api }) => {
		await setSettingValueById(api, 'Accounts_RoomAvatarExternalProviderUrl', '');
		await setSettingValueById(api, 'Accounts_AvatarExternalProviderUrl', '');
	});

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);

		const fulfillWithImage = (route: Route) =>
			route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>' });

		await page.route(`${providerUrlPrefix}**`, fulfillWithImage);
		await page.route((url) => /^\/avatar\/[^/]+$/.test(url.pathname), fulfillWithImage);

		await poHomeChannel.goto();
	});

	test.describe('public channels', () => {
		let channelName = '';
		let roomId = '';

		test.beforeAll(async ({ api }) => {
			const { channel } = await createTargetChannelAndReturnFullRoom(api);
			channelName = channel.name as string;
			roomId = channel._id;
		});

		test.afterAll(async ({ api }) => {
			await deleteRoom(api, roomId);
		});

		test('expect sidebar avatar to have provider prefix', async () => {
			await expect(poHomeChannel.sidebar.getSidebarItemByName(channelName).locator('img')).toHaveAttribute(
				'src',
				`${providerUrlPrefix}${roomId}`,
			);
		});

		test('expect room info avatar to have provider prefix', async () => {
			await poHomeChannel.navbar.openChat(channelName);
			await poHomeChannel.roomToolbar.openRoomInfo();
			await expect(poHomeChannel.tabs.room.root.locator('img').first()).toHaveAttribute('src', `${providerUrlPrefix}${roomId}`);
		});
	});

	test.describe('private channels', () => {
		let channelName = '';
		let roomId = '';

		test.beforeAll(async ({ api }) => {
			const { group } = await createTargetGroupAndReturnFullRoom(api);
			channelName = group.name as string;
			roomId = group._id;
		});

		test.afterAll(async ({ api }) => {
			await deleteRoom(api, roomId);
		});

		test('expect sidebar avatar to have provider prefix', async () => {
			await expect(poHomeChannel.sidebar.getSidebarItemByName(channelName).locator('img')).toHaveAttribute(
				'src',
				`${providerUrlPrefix}${roomId}`,
			);
		});

		test('expect room info avatar to have provider prefix', async () => {
			await poHomeChannel.navbar.openChat(channelName);
			await poHomeChannel.roomToolbar.openRoomInfo();
			await expect(poHomeChannel.tabs.room.root.locator('img').first()).toHaveAttribute('src', `${providerUrlPrefix}${roomId}`);
		});
	});

	test.describe('direct messages', () => {
		const { username } = Users.user2.data;
		const avatarPath = new RegExp(`/avatar/${username}(\\?.*)?$`);
		let roomId = '';
		let user2Page: Page | undefined;

		test.beforeAll(async ({ api, browser }) => {
			roomId = await createDirectMessageRoom(api, username);

			const { page } = await createAuxContext(browser, Users.user2);
			user2Page = page;
			const user2HomeChannel = new HomeChannel(page);
			await user2HomeChannel.navbar.openChat(Users.admin.data.username);
			await user2HomeChannel.content.sendMessage('hello world');
		});

		test.afterAll(async ({ api }) => {
			if (roomId) {
				await deleteRoom(api, roomId);
			}
			await user2Page?.close();
		});

		test('expect sidebar avatar to be served by the server proxy', async () => {
			await expect(poHomeChannel.sidebar.getSidebarItemByName(username).locator('img')).toHaveAttribute('src', avatarPath);
		});

		test('expect user info avatar to be served by the server proxy', async () => {
			await poHomeChannel.navbar.openChat(username);
			await poHomeChannel.roomToolbar.openUserInfo();
			await expect(poHomeChannel.tabs.userInfo.root.locator('img').first()).toHaveAttribute('src', avatarPath);
		});

		test('expect message avatar to be served by the server proxy', async () => {
			await poHomeChannel.navbar.openChat(username);
			await expect(poHomeChannel.content.lastUserMessage.locator('img').first()).toHaveAttribute('src', avatarPath);
		});

		test('expect user card avatar to be served by the server proxy', async () => {
			await poHomeChannel.navbar.openChat(username);
			await poHomeChannel.content.lastUserMessage.locator('.rcx-message-header__name-container').hover();
			await expect(poHomeChannel.userCard.imgUserCard).toHaveAttribute('src', avatarPath);
		});
	});
});
