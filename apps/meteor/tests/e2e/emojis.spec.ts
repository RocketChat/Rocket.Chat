import { test, expect } from './utils/test';
import { HomeChannel } from './page-objects';
import { createTargetChannel } from './utils';

test.use({ storageState: 'session-admin.json' });

test.describe.serial('emoji', () => {
	let poHomeChannel: HomeChannel;
	let targetChannel: string;

	test.beforeAll(async ({ browser }) => {
		targetChannel = await createTargetChannel(browser);
	});

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);

		await page.goto('/home');
	});

	test('expect pick and send grinning emoji', async ({ page }) => {
		await poHomeChannel.sidenav.openChat(targetChannel);
		await poHomeChannel.content.pickEmoji('emoji-grinning');
		await page.keyboard.press('Enter');

		await expect(poHomeChannel.content.lastUserMessage).toContainText('😀');
	});

	test('expect render special characters and numbers properly', async () => {
		await poHomeChannel.sidenav.openChat(targetChannel);

		await poHomeChannel.content.sendMessage('® © ™ # *');
		await expect(poHomeChannel.content.lastUserMessage).toContainText('® © ™ # *');

		await poHomeChannel.content.sendMessage('0 1 2 3 4 5 6 7 8 9');
		await expect(poHomeChannel.content.lastUserMessage).toContainText('0 1 2 3 4 5 6 7 8 9');
	});
});
