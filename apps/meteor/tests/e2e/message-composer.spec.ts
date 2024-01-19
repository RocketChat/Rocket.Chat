import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { createTargetChannel } from './utils';
import { expect, test } from './utils/test';

test.use({ storageState: Users.user1.state });

test.describe.serial('Composer', () => {
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

		await expect(poHomeChannel.composerToolboxActions).toHaveCount(11);
	});

	test('should have only the main formatter and the main action', async ({ page }) => {
		await page.setViewportSize({ width: 768, height: 600 });

		await poHomeChannel.sidenav.openChat(targetChannel);
		await poHomeChannel.content.sendMessage('hello composer');

		await expect(poHomeChannel.composerToolboxActions).toHaveCount(5);
	});
});
