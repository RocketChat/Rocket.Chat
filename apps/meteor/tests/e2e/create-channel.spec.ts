import { faker } from '@faker-js/faker';

import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { deleteChannel } from './utils';
import { test, expect } from './utils/test';

test.use({ storageState: Users.admin.state });

test.describe.serial('create-channel', () => {
	let poHomeChannel: HomeChannel;
	let channelName: string;

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);

		await page.goto('/home');
	});

	test.beforeEach(async ({ api }) => {
		await deleteChannel(api, channelName);
	});

	test('expect create a public channel', async ({ page }) => {
		channelName = faker.string.uuid();

		await poHomeChannel.sidebar.openCreateNewByLabel('Channel');
		await poHomeChannel.createRoomModal.inputChannelName.fill(channelName);
		await poHomeChannel.createRoomModal.checkboxPrivate.click();
		await poHomeChannel.createRoomModal.btnCreate.click();

		await expect(page).toHaveURL(`/channel/${channelName}`);
	});

	test('expect create a private channel', async ({ page }) => {
		channelName = faker.string.uuid();

		await poHomeChannel.sidebar.openCreateNewByLabel('Channel');
		await poHomeChannel.createRoomModal.inputChannelName.fill(channelName);
		await poHomeChannel.createRoomModal.btnCreate.click();

		await expect(page).toHaveURL(`/group/${channelName}`);
	});
});
