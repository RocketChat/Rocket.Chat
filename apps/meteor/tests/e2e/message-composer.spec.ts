import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { createTargetChannel } from './utils';
import { expect, test } from './utils/test';

test.use({ storageState: Users.user1.state });

test.describe.serial('message-composer', () => {
	let poHomeChannel: HomeChannel;
	let targetChannel: string;

	test.beforeAll(async ({ api }) => {
		targetChannel = await createTargetChannel(api);
	});

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);

		await page.goto('/home');
	});

	test('should have all formatters and the main actions visible on toolbar', async () => {
		await poHomeChannel.sidenav.openChat(targetChannel);
		await poHomeChannel.content.sendMessage('hello composer');

		await expect(poHomeChannel.composerToolbarActions).toHaveCount(12);
	});

	test('should have only the main formatter and the main action', async ({ page }) => {
		await page.setViewportSize({ width: 768, height: 600 });

		await poHomeChannel.sidenav.openChat(targetChannel);
		await poHomeChannel.content.sendMessage('hello composer');

		await expect(poHomeChannel.composerToolbarActions).toHaveCount(5);
	});

	test('should navigate on toolbar using arrow keys', async ({ page }) => {
		await poHomeChannel.sidenav.openChat(targetChannel);
		await poHomeChannel.content.sendMessage('hello composer');

		await page.keyboard.press('Tab');
		await page.keyboard.press('ArrowRight');
		await page.keyboard.press('ArrowRight');
		await expect(poHomeChannel.composerToolbar.getByRole('button', { name: 'Italic' })).toBeFocused();

		await page.keyboard.press('ArrowLeft');
		await expect(poHomeChannel.composerToolbar.getByRole('button', { name: 'Bold' })).toBeFocused();
	});

	test('should move the focus away from toolbar using tab key', async ({ page }) => {
		await poHomeChannel.sidenav.openChat(targetChannel);
		await poHomeChannel.content.sendMessage('hello composer');

		await page.keyboard.press('Tab');
		await page.keyboard.press('Tab');
		
		await expect(poHomeChannel.composerToolbar.getByRole('button', { name: 'Emoji' })).not.toBeFocused();
	});
});
