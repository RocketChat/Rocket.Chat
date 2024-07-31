import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { createTargetChannel } from './utils';
import { test, expect } from './utils/test';

test.use({ storageState: Users.admin.state });

test.describe.serial('Channels - Sidebar Actions', () => {
	let poHomeChannel: HomeChannel;
	let targetChannel: string;

	test.beforeEach(async ({ page, api }) => {
		poHomeChannel = new HomeChannel(page);
		await page.emulateMedia({ reducedMotion: 'reduce' });

		targetChannel = await createTargetChannel(api);

		await page.goto('/home');
	});

	test.afterEach(async ({ api }) => {
		await api.post('/channels.delete', { roomName: targetChannel });
	});

	test('should not mark empty room as unread', async () => {
		// focus should be on the next item
		const sidebarItem = await poHomeChannel.sidenav.selectMarkAsUnread(targetChannel);
		await expect(sidebarItem.locator('.rcx-badge')).not.toBeVisible();
	});

	test('should mark a populated room as unread', async () => {
		// focus should be on the next item
		await poHomeChannel.sidenav.openChat(targetChannel);
		await poHomeChannel.content.sendMessage('this is a message for reply');
		const sidebarItem = await poHomeChannel.sidenav.selectMarkAsUnread(targetChannel);
		await expect(sidebarItem.locator('.rcx-badge')).toBeVisible();
	});
});
