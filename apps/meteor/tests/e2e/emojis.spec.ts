import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { createTargetChannel } from './utils';
import { test, expect } from './utils/test';

test.use({ storageState: Users.admin.state });

test.describe.serial('emoji', () => {
	let poHomeChannel: HomeChannel;
	let targetChannel: string;

	test.beforeAll(async ({ api }) => {
		targetChannel = await createTargetChannel(api);
	});

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);

		await page.goto('/home');
	});

	test('expect pick and send grinning emoji', async ({ page }) => {
		await poHomeChannel.sidenav.openChat(targetChannel);
		await poHomeChannel.content.pickEmoji('grinning');
		await page.keyboard.press('Enter');

		await expect(poHomeChannel.content.lastUserMessage).toContainText('😀');
	});

	test('expect send emoji via text', async ({ page }) => {
		await poHomeChannel.sidenav.openChat(targetChannel);
		await poHomeChannel.content.sendMessage(':innocent:');
		await page.keyboard.press('Enter');

		await expect(poHomeChannel.content.lastUserMessage).toContainText('😇');
	});

	test('expect render special characters and numbers properly', async () => {
		await poHomeChannel.sidenav.openChat(targetChannel);

		await poHomeChannel.content.sendMessage('® © ™ # *');
		await expect(poHomeChannel.content.lastUserMessage).toContainText('® © ™ # *');
	});
});
