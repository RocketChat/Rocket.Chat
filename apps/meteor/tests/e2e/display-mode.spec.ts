import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { createTargetChannel, deleteChannel, sendTargetChannelMessage } from './utils';
import { test, expect } from './utils/test';

test.use({ storageState: Users.admin.state });
let sentMessage: string;
let channelName: string;
test.describe.serial('display settings', () => {
	let poHomeChannel: HomeChannel;

	test.beforeAll(async ({ api }) => {
		channelName = await createTargetChannel(api, { members: ['user1', 'user2'] });
	});

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);

		await page.goto('/home');
	});

	test.afterAll(async ({ api }) => {
		await deleteChannel(api, channelName);
	});

	test('verify display modes and avatar toggle functionality', async ({ api, page }) => {
		sentMessage = await sendTargetChannelMessage(api, channelName);

		await test.step('expect to select display mode as Extended', async () => {
			await poHomeChannel.sidenav.setDisplayMode('Extended');
			await expect(poHomeChannel.sidenav.getSidebarItemByName(channelName)).toContainText(sentMessage);
		});

		await test.step('expect to select display mode as Medium', async () => {
			await poHomeChannel.sidenav.setDisplayMode('Medium');
			await expect(poHomeChannel.sidenav.getSidebarItemByName(channelName)).not.toContainText(sentMessage);
		});

		await test.step('expect to select display mode as condensed', async () => {
			await poHomeChannel.sidenav.setDisplayMode('Condensed');
			await expect(poHomeChannel.sidenav.getSidebarItemAvatar(channelName)).toHaveCSS('height', '16px');
		});

		await test.step('expect to hide avatars in sidebar when toggle is off', async () => {
			await test.step('disable avatars', async () => {
				await poHomeChannel.sidenav.sidebarToolbar.getByRole('button', { name: 'Display', exact: true }).click();
				await poHomeChannel.sidenav.menuItemSwitchAvatars.click();
			});

			await page.keyboard.press('Escape'); // Close the menu
			await expect(poHomeChannel.sidenav.getSidebarItemAvatar(channelName)).toBeHidden();
		});

		await test.step('expect to display Avatars in sidebar when toggle is on', async () => {
			await test.step('enable avatars', async () => {
				await poHomeChannel.sidenav.sidebarToolbar.getByRole('button', { name: 'Display', exact: true }).click();
				await poHomeChannel.sidenav.menuItemSwitchAvatars.click();
			});

			await page.keyboard.press('Escape'); // Close the menu
			await expect(poHomeChannel.sidenav.getSidebarItemAvatar(channelName)).toBeVisible();
		});
	});
});
