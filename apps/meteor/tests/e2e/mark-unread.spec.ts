import { createAuxContext } from './fixtures/createAuxContext';
import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { createTargetChannel } from './utils';
import { test, expect } from './utils/test';

test.use({ storageState: Users.admin.state });

test.describe('Mark Unread - Sidebar Action', () => {
	let poHomeChannel: HomeChannel;
	let targetChannel: string;

	test.beforeEach(async ({ page, api }) => {
		poHomeChannel = new HomeChannel(page);
		await page.emulateMedia({ reducedMotion: 'reduce' });

		targetChannel = await createTargetChannel(api, { members: ['user2'] });

		await page.goto('/home');
	});

	test.afterEach(async ({ api }) => {
		await api.post('/channels.delete', { roomName: targetChannel });
	});

	test('should not mark empty room as unread', async () => {
		const sidebarItem = await poHomeChannel.sidenav.selectMarkAsUnread(targetChannel);
		await expect(sidebarItem.locator('.rcx-badge')).not.toBeVisible();
	});

	test('should mark a populated room as unread', async () => {
		await poHomeChannel.sidenav.openChat(targetChannel);
		await poHomeChannel.content.sendMessage('this is a message for reply');
		const sidebarItem = await poHomeChannel.sidenav.selectMarkAsUnread(targetChannel);
		await expect(sidebarItem.locator('.rcx-badge')).toBeVisible();
	});

	test.describe('Mark Unread - Other Channel', () => {
		let poHomeChannelUser2: HomeChannel;
		let secondChannel: string;

		test.beforeEach(async ({ api }) => {
			secondChannel = await createTargetChannel(api);
		});

		test.afterEach(async ({ api }) => {
			await api.post('/channels.delete', { roomName: secondChannel });
		});

		test('should mark a populated room as unread', async () => {
			await poHomeChannel.sidenav.openChat(targetChannel);
			await poHomeChannel.content.sendMessage('this is a message for reply');

			await poHomeChannel.sidenav.openChat(secondChannel);
			await poHomeChannel.content.sendMessage('this is a message for reply');

			const sidebarItem = await poHomeChannel.sidenav.selectMarkAsUnread(targetChannel);
			await expect(sidebarItem.locator('.rcx-badge')).toBeVisible();
			await expect(poHomeChannel.page.locator('[data-qa-type="message"]').last()).toBeVisible();
		});

		test.afterAll(async () => {
			await poHomeChannelUser2.page.close();
		});
	});

	test.describe('Mark Unread - Message Action', () => {
		let poHomeChannelUser2: HomeChannel;

		test.beforeEach(async ({ browser }) => {
			const { page: user2Page } = await createAuxContext(browser, Users.user2);
			poHomeChannelUser2 = new HomeChannel(user2Page);

			await poHomeChannelUser2.sidenav.openChat(targetChannel);
			await poHomeChannelUser2.content.sendMessage('this is a message for reply');
		});

		test('should mark a populated room as unread', async () => {
			await poHomeChannel.sidenav.openChat(targetChannel);

			await poHomeChannel.content.openLastMessageMenu();
			await poHomeChannel.page.locator('role=menuitem[name="Mark Unread"]').click();
			const sidebarItem = poHomeChannel.sidenav.getSidebarItemByName(targetChannel);
			await expect(sidebarItem.locator('.rcx-badge')).toBeVisible();
		});

		test.afterEach(async () => {
			await poHomeChannelUser2.page.close();
		});
	});
});
