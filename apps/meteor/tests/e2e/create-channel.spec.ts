import { faker } from '@faker-js/faker';

import { test, expect } from './utils/test';
import { HomeChannel } from './page-objects';

test.use({ storageState: 'admin-session.json' });

test.describe.serial('channel-management', () => {
	let poHomeChannel: HomeChannel;

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);

		await page.goto('/home');
	});

	test('expect create a public channel', async ({ page }) => {
		const channelName = faker.datatype.uuid();

		await poHomeChannel.sidenav.openNewByLabel('Channel');
		await poHomeChannel.sidenav.checkboxPrivateChannel.click();
		await poHomeChannel.sidenav.inputChannelName.type(channelName);
		await poHomeChannel.sidenav.btnCreate.click();

		await expect(page).toHaveURL(`/channel/${channelName}`);
	});

	test('expect create a private channel', async ({ page }) => {
		const channelName = faker.datatype.uuid();

		await poHomeChannel.sidenav.openNewByLabel('Channel');
		await poHomeChannel.sidenav.inputChannelName.type(channelName);
		await poHomeChannel.sidenav.btnCreate.click();

		await expect(page).toHaveURL(`/group/${channelName}`);
	});
});
