import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { createTargetChannel, deleteChannel, sendTargetChannelMessage } from './utils';
import { test, expect } from './utils/test';

test.use({ storageState: Users.admin.state });
let sentMessage: string;
let channelName: string;
test.describe.parallel('sidebar', () => {
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

	test('expect to select display mode as Extended', async ({ api }) => {
		sentMessage = await sendTargetChannelMessage(api, channelName);
		await poHomeChannel.sidenav.setDisplayMode('Extended');
		const message = await poHomeChannel.sidenav.sidebarItemMessage.textContent();
		expect(message).toContain(`${sentMessage}`);
	});

	test('expect to select display mode as Medium', async () => {
		await poHomeChannel.sidenav.setDisplayMode('Medium');
		await expect(poHomeChannel.sidenav.sidebarItemMessage).not.toBeVisible();
	});

	test('expect to select display mode as condensed', async () => {
		await poHomeChannel.sidenav.setDisplayMode('Condensed');
		await expect(poHomeChannel.sidenav.sidebarListItem).toHaveAttribute('data-known-size', '28');
	});

	test('expect to display Avatars in sidebar when toggle is on', async () => {
		await poHomeChannel.sidenav.sidebarToolbar.getByRole('button', { name: 'Display', exact: true }).click();
		const isChecked = await poHomeChannel.sidenav.switchAvatars.isChecked();
		expect((await poHomeChannel.sidenav.getSidebarAvatars(channelName)).isVisible());
		if (!isChecked) {
			await poHomeChannel.sidenav.switchAvatars.click();
			expect((await poHomeChannel.sidenav.getSidebarAvatars(channelName)).isVisible());
		}
	});

	test('expect to hide avatars in sidebar when toggle is off', async () => {
		await poHomeChannel.sidenav.sidebarToolbar.getByRole('button', { name: 'Display', exact: true }).click();
		const isChecked = await poHomeChannel.sidenav.switchAvatars.isChecked();
		await poHomeChannel.sidenav.switchAvatars.click();
		expect((await poHomeChannel.sidenav.getSidebarAvatars(channelName)).isHidden());
		if (!isChecked) {
			expect((await poHomeChannel.sidenav.getSidebarAvatars(channelName)).isHidden());
		}
	});
});
