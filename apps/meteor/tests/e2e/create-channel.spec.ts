import { faker } from '@faker-js/faker';

import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { deleteChannel, deletePrivateChannel } from './utils';
import { test, expect } from './utils/test';

test.use({ storageState: Users.admin.state });

test.describe.serial('create-channel', () => {
	let poHomeChannel: HomeChannel;
	let channelName: string;

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);
		channelName = faker.string.uuid();

		await page.goto('/home');
	});

	test.afterEach(async ({ api }) => {
		await deleteChannel(api, channelName);
		await deletePrivateChannel(api, channelName);
	});

	test('expect create a public channel', async ({ page }) => {
		await poHomeChannel.sidebar.openCreateNewByLabel('Channel');
		await poHomeChannel.createRoomModal.inputChannelName.fill(channelName);
		await poHomeChannel.createRoomModal.checkboxPrivate.click();
		await poHomeChannel.createRoomModal.btnCreate.click();

		await expect(page).toHaveURL(`/channel/${channelName}`);
	});

	test('expect create a private channel', async ({ page }) => {
		await poHomeChannel.sidebar.openCreateNewByLabel('Channel');
		await poHomeChannel.createRoomModal.inputChannelName.fill(channelName);
		await poHomeChannel.createRoomModal.btnCreate.click();

		await expect(page).toHaveURL(`/group/${channelName}`);
	});
});
