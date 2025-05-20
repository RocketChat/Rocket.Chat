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

	test('verify display modes and avatar toggle functionality', async ({ api }) => {
		await test.step('expect to select display mode as Extended', async () => {
			sentMessage = await sendTargetChannelMessage(api, channelName);
			await poHomeChannel.sidenav.setDisplayMode('Extended');
			const message = await poHomeChannel.sidenav.getsidebarItemMessage(channelName).textContent();
			expect(message).toContain(`${sentMessage}`);
		});

		await test.step('expect to select display mode as Medium', async () => {
			await poHomeChannel.sidenav.setDisplayMode('Medium');
			await expect(poHomeChannel.sidenav.getsidebarItemMessage(channelName)).not.toBeVisible();
		});

		await test.step('expect to select display mode as condensed', async () => {
			await poHomeChannel.sidenav.setDisplayMode('Condensed');
			await expect(poHomeChannel.sidenav.sidebarListItem).toHaveAttribute('data-known-size', '28');
		});

		await test.step('expect to display Avatars in sidebar when toggle is on', async () => {
			await poHomeChannel.sidenav.sidebarToolbar.getByRole('button', { name: 'Display', exact: true }).click();
			const isChecked = await poHomeChannel.sidenav.switchAvatars.isChecked();
			if (!isChecked) {
				await poHomeChannel.sidenav.switchAvatars.click();
			}
			await expect(poHomeChannel.sidenav.getSidebarAvatars(channelName)).toBeVisible();
		});

		await test.step('expect to hide avatars in sidebar when toggle is off', async () => {
			const isChecked = await poHomeChannel.sidenav.switchAvatars.isChecked();
			if (isChecked) {
				await poHomeChannel.sidenav.switchAvatars.click();
			}
			await expect(poHomeChannel.sidenav.getSidebarAvatars(channelName)).toBeHidden();
		});
	});
});
